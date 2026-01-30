import { PrismaClient } from '@prisma/client';
import { AmazonAdsClient } from '@/lib/amazon/ads-client';

const prisma = new PrismaClient();

export class OptimizationEngine {
  async executeRule(rule: any, connection: any) {
    const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startedAt = new Date();

    try {
      // Create execution log
      await prisma.$executeRaw`
        INSERT INTO optimization_execution_logs (
          id, rule_id, amazon_connection_id, status, started_at, created_at
        ) VALUES (
          ${logId}, ${rule.id}, ${rule.amazon_connection_id}, 'RUNNING', ${startedAt}, NOW()
        )
      `;

      // Initialize Amazon Ads Client
      const adsClient = new AmazonAdsClient({
        accessToken: connection.access_token,
        profileId: connection.profile_id,
        region: connection.region || 'NA'
      });

      let entitiesAffected = 0;
      const changesMade: any[] = [];

      // Execute based on rule type
      switch (rule.rule_type) {
        case 'BID_ADJUSTMENT':
          const bidResults = await this.executeBidAdjustment(rule, adsClient, connection);
          entitiesAffected = bidResults.entitiesAffected;
          changesMade.push(...bidResults.changes);
          break;

        case 'KEYWORD_AUTOMATION':
          const kwResults = await this.executeKeywordAutomation(rule, adsClient, connection);
          entitiesAffected = kwResults.entitiesAffected;
          changesMade.push(...kwResults.changes);
          break;

        case 'BUDGET_CONTROL':
          const budgetResults = await this.executeBudgetControl(rule, adsClient, connection);
          entitiesAffected = budgetResults.entitiesAffected;
          changesMade.push(...budgetResults.changes);
          break;

        case 'NEGATIVE_KEYWORD':
          const negResults = await this.executeNegativeKeyword(rule, adsClient, connection);
          entitiesAffected = negResults.entitiesAffected;
          changesMade.push(...negResults.changes);
          break;

        default:
          throw new Error(`Unknown rule type: ${rule.rule_type}`);
      }

      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();

      // Update execution log
      await prisma.$executeRaw`
        UPDATE optimization_execution_logs
        SET status = 'SUCCESS',
            completed_at = ${completedAt},
            duration_ms = ${durationMs},
            entities_affected = ${entitiesAffected},
            changes_made = ${JSON.stringify(changesMade)}::jsonb
        WHERE id = ${logId}
      `;

      // Update rule stats
      await prisma.$executeRaw`
        UPDATE profile_optimization_rules
        SET last_run_at = ${completedAt},
            run_count = run_count + 1,
            success_count = success_count + 1,
            next_run_at = ${this.calculateNextRun(rule.schedule, rule.custom_cron)},
            updated_at = NOW()
        WHERE id = ${rule.id}
      `;

      return {
        logId,
        status: 'SUCCESS',
        entitiesAffected,
        changesMade,
        durationMs
      };
    } catch (error: any) {
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();

      // Update execution log with error
      await prisma.$executeRaw`
        UPDATE optimization_execution_logs
        SET status = 'FAILED',
            completed_at = ${completedAt},
            duration_ms = ${durationMs},
            error_message = ${error.message}
        WHERE id = ${logId}
      `;

      // Update rule stats
      await prisma.$executeRaw`
        UPDATE profile_optimization_rules
        SET last_run_at = ${completedAt},
            run_count = run_count + 1,
            failure_count = failure_count + 1,
            updated_at = NOW()
        WHERE id = ${rule.id}
      `;

      throw error;
    }
  }

  private async executeBidAdjustment(rule: any, adsClient: any, connection: any) {
    const conditions = rule.conditions;
    const actions = rule.actions;
    const changes: any[] = [];

    // Fetch keywords based on conditions
    const keywords = await prisma.$queryRawUnsafe(`
      SELECT k.* FROM keywords k
      JOIN campaigns c ON k.campaignId = c.id
      WHERE c.user_id = ${connection.user_id}
      AND k.state = 'ENABLED'
      ${conditions.minImpressions ? `AND k.impressions >= ${conditions.minImpressions}` : ''}
      ${conditions.minClicks ? `AND k.clicks >= ${conditions.minClicks}` : ''}
      ${conditions.maxAcos ? `AND (k.spend / NULLIF(k.sales, 0)) * 100 <= ${conditions.maxAcos}` : ''}
      ${conditions.minAcos ? `AND (k.spend / NULLIF(k.sales, 0)) * 100 >= ${conditions.minAcos}` : ''}
    `);

    for (const keyword of keywords as any[]) {
      const currentBid = keyword.bid || 0;
      let newBid = currentBid;

      if (actions.adjustmentType === 'PERCENTAGE') {
        newBid = currentBid * (1 + actions.adjustmentValue / 100);
      } else if (actions.adjustmentType === 'FIXED') {
        newBid = currentBid + actions.adjustmentValue;
      } else if (actions.adjustmentType === 'SET') {
        newBid = actions.adjustmentValue;
      }

      // Apply min/max constraints
      if (actions.minBid) newBid = Math.max(newBid, actions.minBid);
      if (actions.maxBid) newBid = Math.min(newBid, actions.maxBid);
      newBid = Math.round(newBid * 100) / 100; // Round to 2 decimals

      if (newBid !== currentBid) {
        // Update bid via Amazon Ads API
        try {
          await adsClient.updateKeywordBid(keyword.platformId, newBid);

          // Update in database
          await prisma.$executeRaw`
            UPDATE keywords
            SET bid = ${newBid}, updatedAt = NOW()
            WHERE id = ${keyword.id}
          `;

          changes.push({
            entity: 'keyword',
            entityId: keyword.id,
            action: 'bid_adjustment',
            oldValue: currentBid,
            newValue: newBid
          });
        } catch (err: any) {
          console.error(`Failed to update keyword ${keyword.id}:`, err.message);
        }
      }
    }

    return { entitiesAffected: changes.length, changes };
  }

  private async executeKeywordAutomation(rule: any, adsClient: any, connection: any) {
    const conditions = rule.conditions;
    const actions = rule.actions;
    const changes: any[] = [];

    // Pause underperforming keywords
    if (actions.pauseUnderperforming) {
      const keywords = await prisma.$queryRawUnsafe(`
        SELECT k.* FROM keywords k
        JOIN campaigns c ON k.campaignId = c.id
        WHERE c.user_id = ${connection.user_id}
        AND k.state = 'ENABLED'
        AND k.impressions >= ${conditions.minImpressions || 100}
        AND k.clicks >= ${conditions.minClicks || 5}
        AND (k.spend / NULLIF(k.sales, 0)) * 100 > ${conditions.maxAcos || 50}
      `);

      for (const keyword of keywords as any[]) {
        try {
          await adsClient.updateKeywordState(keyword.platformId, 'PAUSED');

          await prisma.$executeRaw`
            UPDATE keywords
            SET state = 'PAUSED', updatedAt = NOW()
            WHERE id = ${keyword.id}
          `;

          changes.push({
            entity: 'keyword',
            entityId: keyword.id,
            action: 'pause',
            reason: 'underperforming'
          });
        } catch (err: any) {
          console.error(`Failed to pause keyword ${keyword.id}:`, err.message);
        }
      }
    }

    return { entitiesAffected: changes.length, changes };
  }

  private async executeBudgetControl(rule: any, adsClient: any, connection: any) {
    const conditions = rule.conditions;
    const actions = rule.actions;
    const changes: any[] = [];

    // Get campaigns that need budget adjustment
    const campaigns = await prisma.$queryRawUnsafe(`
      SELECT c.* FROM campaigns c
      WHERE c.user_id = ${connection.user_id}
      AND c.state = 'ENABLED'
      ${conditions.minRoas ? `AND (c.sales / NULLIF(c.spend, 0)) >= ${conditions.minRoas}` : ''}
      ${conditions.maxRoas ? `AND (c.sales / NULLIF(c.spend, 0)) <= ${conditions.maxRoas}` : ''}
    `);

    for (const campaign of campaigns as any[]) {
      const currentBudget = campaign.budget || 0;
      let newBudget = currentBudget;

      if (actions.budgetAdjustmentType === 'PERCENTAGE') {
        newBudget = currentBudget * (1 + actions.budgetAdjustmentValue / 100);
      } else if (actions.budgetAdjustmentType === 'FIXED') {
        newBudget = currentBudget + actions.budgetAdjustmentValue;
      }

      if (actions.minBudget) newBudget = Math.max(newBudget, actions.minBudget);
      if (actions.maxBudget) newBudget = Math.min(newBudget, actions.maxBudget);
      newBudget = Math.round(newBudget * 100) / 100;

      if (newBudget !== currentBudget) {
        try {
          await adsClient.updateCampaignBudget(campaign.platformId, newBudget);

          await prisma.$executeRaw`
            UPDATE campaigns
            SET budget = ${newBudget}, updatedAt = NOW()
            WHERE id = ${campaign.id}
          `;

          changes.push({
            entity: 'campaign',
            entityId: campaign.id,
            action: 'budget_adjustment',
            oldValue: currentBudget,
            newValue: newBudget
          });
        } catch (err: any) {
          console.error(`Failed to update campaign ${campaign.id}:`, err.message);
        }
      }
    }

    return { entitiesAffected: changes.length, changes };
  }

  private async executeNegativeKeyword(rule: any, adsClient: any, connection: any) {
    const conditions = rule.conditions;
    const actions = rule.actions;
    const changes: any[] = [];

    // Find search terms to add as negative keywords
    const searchTerms = await prisma.$queryRawUnsafe(`
      SELECT DISTINCT st.searchTerm, st.campaignId, st.adGroupId
      FROM search_terms st
      JOIN campaigns c ON st.campaignId = c.id
      WHERE c.user_id = ${connection.user_id}
      AND st.impressions >= ${conditions.minImpressions || 10}
      AND st.clicks >= ${conditions.minClicks || 1}
      AND (st.spend / NULLIF(st.sales, 0)) * 100 > ${conditions.maxAcos || 100}
      AND st.conversions = 0
    `);

    for (const searchTerm of searchTerms as any[]) {
      try {
        // Add negative keyword
        await adsClient.addNegativeKeyword(
          searchTerm.campaignId,
          searchTerm.adGroupId,
          searchTerm.searchTerm,
          actions.matchType || 'NEGATIVE_PHRASE'
        );

        changes.push({
          entity: 'negative_keyword',
          action: 'add',
          keyword: searchTerm.searchTerm,
          campaignId: searchTerm.campaignId,
          adGroupId: searchTerm.adGroupId
        });
      } catch (err: any) {
        console.error(`Failed to add negative keyword ${searchTerm.searchTerm}:`, err.message);
      }
    }

    return { entitiesAffected: changes.length, changes };
  }

  private calculateNextRun(schedule: string, customCron?: string): Date {
    const now = new Date();
    
    switch (schedule) {
      case 'HOURLY':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case 'DAILY':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow;
      case 'WEEKLY':
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(0, 0, 0, 0);
        return nextWeek;
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  async runScheduledRules() {
    const now = new Date();

    // Get all enabled rules that are due
    const dueRules = await prisma.$queryRaw`
      SELECT por.*, ac.*
      FROM profile_optimization_rules por
      JOIN amazon_connections ac ON por.amazon_connection_id = ac.id
      WHERE por.enabled = true
      AND por.next_run_at <= ${now}
      ORDER BY por.priority DESC
    `;

    console.log(`Found ${Array.isArray(dueRules) ? dueRules.length : 0} rules to execute`);

    for (const rule of dueRules as any[]) {
      try {
        await this.executeRule(rule, rule);
        console.log(`Successfully executed rule ${rule.id}`);
      } catch (error: any) {
        console.error(`Failed to execute rule ${rule.id}:`, error.message);
      }
    }
  }
}
