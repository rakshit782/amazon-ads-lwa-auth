// Generate mock Amazon Ads data for testing
require('dotenv').config();
const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

async function generateMockData() {
  console.log('\n🎲 Generating Mock Amazon Ads Data...\n');

  try {
    // Get first user
    const userResult = await query('SELECT * FROM users LIMIT 1');
    
    if (userResult.rows.length === 0) {
      console.log('❌ No users found. Please register a user first.');
      console.log('   Run: npm run dev');
      console.log('   Then visit: http://localhost:5500/login.html\n');
      process.exit(1);
    }

    const user = userResult.rows[0];
    console.log(`✅ Found user: ${user.email}\n`);

    // Generate campaigns
    console.log('📊 Generating campaigns...');
    const campaigns = [];
    const campaignNames = [
      'Summer Sale 2026', 
      'New Product Launch', 
      'Brand Awareness Campaign',
      'Holiday Special', 
      'Back to School Promo',
      'Flash Sale Weekend',
      'Clearance Campaign',
      'Premium Product Line'
    ];

    for (let i = 0; i < campaignNames.length; i++) {
      const impressions = Math.floor(Math.random() * 100000) + 10000;
      const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.01));
      const spend = clicks * (Math.random() * 2 + 0.5);
      const sales = spend * (Math.random() * 5 + 1);
      const orders = Math.floor(clicks * (Math.random() * 0.1 + 0.02));

      const campaign = {
        id: uuidv4(),
        userId: user.id,
        platformId: `camp-${100000 + i}`,
        name: campaignNames[i],
        state: i < 6 ? 'enabled' : 'paused',
        budget: Math.floor(Math.random() * 5000) + 1000,
        budgetType: 'daily',
        startDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        impressions,
        clicks,
        spend,
        sales,
        orders,
        acos: (spend / sales * 100).toFixed(2),
        roas: (sales / spend).toFixed(2),
        ctr: (clicks / impressions * 100).toFixed(2),
        cpc: (spend / clicks).toFixed(2),
        conversionRate: (orders / clicks * 100).toFixed(2)
      };

      await query(
        `INSERT INTO campaigns (
          id, "userId", "platformId", name, state, budget, "budgetType",
          "startDate", impressions, clicks, spend, sales, orders,
          acos, roas, ctr, cpc, "conversionRate", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT ("platformId") DO NOTHING`,
        [
          campaign.id, campaign.userId, campaign.platformId, campaign.name,
          campaign.state, campaign.budget, campaign.budgetType, campaign.startDate,
          campaign.impressions, campaign.clicks, campaign.spend, campaign.sales,
          campaign.orders, campaign.acos, campaign.roas, campaign.ctr,
          campaign.cpc, campaign.conversionRate
        ]
      );

      campaigns.push(campaign);
      console.log(`   ✅ ${campaign.name} - $${campaign.spend.toFixed(2)} spend, $${campaign.sales.toFixed(2)} sales`);
    }

    // Generate ad groups
    console.log('\n📁 Generating ad groups...');
    let adGroupCount = 0;
    for (const campaign of campaigns) {
      const numAdGroups = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < numAdGroups; i++) {
        const impressions = Math.floor(campaign.impressions / numAdGroups);
        const clicks = Math.floor(campaign.clicks / numAdGroups);
        const spend = campaign.spend / numAdGroups;
        const sales = campaign.sales / numAdGroups;

        await query(
          `INSERT INTO ad_groups (
            id, "userId", "campaignId", "platformId", name, state, "defaultBid",
            impressions, clicks, spend, sales, "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT ("platformId") DO NOTHING`,
          [
            uuidv4(), user.id, campaign.id, `ag-${200000 + adGroupCount}`,
            `Ad Group ${i + 1}`, campaign.state, Math.random() * 3 + 0.5,
            impressions, clicks, spend, sales
          ]
        );
        adGroupCount++;
      }
    }
    console.log(`   ✅ Created ${adGroupCount} ad groups`);

    // Generate keywords
    console.log('\n🔑 Generating keywords...');
    const keywordTemplates = [
      'amazon', 'best seller', 'top rated', 'premium', 'discount',
      'sale', 'new', 'trending', 'popular', 'cheap', 'quality',
      'fast shipping', 'deals', 'clearance', 'limited time'
    ];
    
    let keywordCount = 0;
    for (const campaign of campaigns) {
      const numKeywords = Math.floor(Math.random() * 20) + 10;
      
      for (let i = 0; i < numKeywords; i++) {
        const keyword = keywordTemplates[Math.floor(Math.random() * keywordTemplates.length)];
        const matchType = ['exact', 'phrase', 'broad'][Math.floor(Math.random() * 3)];
        const impressions = Math.floor(Math.random() * 5000) + 100;
        const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.01));
        const spend = clicks * (Math.random() * 2 + 0.5);
        const sales = spend * (Math.random() * 5 + 1);

        await query(
          `INSERT INTO keywords (
            id, "userId", "campaignId", "platformId", "keywordText", "matchType",
            state, bid, impressions, clicks, spend, sales,
            ctr, cpc, acos, "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT ("platformId") DO NOTHING`,
          [
            uuidv4(), user.id, campaign.id, `kw-${300000 + keywordCount}`,
            keyword + ' product', matchType, campaign.state,
            Math.random() * 3 + 0.5, impressions, clicks, spend, sales,
            (clicks / impressions * 100).toFixed(2),
            (spend / clicks).toFixed(2),
            (spend / sales * 100).toFixed(2)
          ]
        );
        keywordCount++;
      }
    }
    console.log(`   ✅ Created ${keywordCount} keywords`);

    // Generate alerts
    console.log('\n🔔 Generating alerts...');
    const alertTypes = [
      { type: 'HIGH_ACOS', message: 'Campaign "Summer Sale 2026" has ACOS above 50%', severity: 'HIGH' },
      { type: 'LOW_BUDGET', message: 'Campaign "New Product Launch" is running low on budget', severity: 'MEDIUM' },
      { type: 'CAMPAIGN_PAUSED', message: 'Campaign "Clearance Campaign" has been paused', severity: 'LOW' },
      { type: 'HIGH_SPEND', message: 'Daily spend limit exceeded for "Brand Awareness Campaign"', severity: 'HIGH' },
      { type: 'LOW_CTR', message: 'Keyword "discount product" has CTR below 0.5%', severity: 'MEDIUM' }
    ];

    for (let i = 0; i < alertTypes.length; i++) {
      const alert = alertTypes[i];
      await query(
        `INSERT INTO alerts (
          id, "userId", type, severity, message, "isRead", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [uuidv4(), user.id, alert.type, alert.severity, alert.message, i > 2]
      );
    }
    console.log(`   ✅ Created ${alertTypes.length} alerts`);

    // Update user last sync
    await query(
      'UPDATE users SET last_sync = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    console.log('\n🎉 Mock data generation complete!\n');
    console.log('📊 Summary:');
    console.log(`   • ${campaigns.length} campaigns`);
    console.log(`   • ${adGroupCount} ad groups`);
    console.log(`   • ${keywordCount} keywords`);
    console.log(`   • ${alertTypes.length} alerts`);
    console.log('\n✅ You can now view the data in your dashboard!\n');

  } catch (error) {
    console.error('❌ Error generating mock data:', error);
  } finally {
    process.exit();
  }
}

generateMockData();