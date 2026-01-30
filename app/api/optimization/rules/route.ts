import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/optimization/rules - List all optimization rules for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');
    const brandId = searchParams.get('brandId');
    const enabled = searchParams.get('enabled');

    const where: any = {
      user_id: parseInt(session.user.id)
    };

    if (connectionId) {
      where.amazon_connection_id = parseInt(connectionId);
    }

    if (brandId) {
      where.brand_id = parseInt(brandId);
    }

    if (enabled !== null && enabled !== undefined) {
      where.enabled = enabled === 'true';
    }

    const rules = await prisma.$queryRaw`
      SELECT * FROM profile_optimization_rules
      WHERE user_id = ${parseInt(session.user.id)}
      ${connectionId ? prisma.$queryRawUnsafe(`AND amazon_connection_id = ${parseInt(connectionId)}`) : prisma.$queryRawUnsafe('')}
      ${brandId ? prisma.$queryRawUnsafe(`AND brand_id = ${parseInt(brandId)}`) : prisma.$queryRawUnsafe('')}
      ${enabled !== null ? prisma.$queryRawUnsafe(`AND enabled = ${enabled === 'true'}`) : prisma.$queryRawUnsafe('')}
      ORDER BY priority DESC, created_at DESC
    `;

    return NextResponse.json({ success: true, rules });
  } catch (error: any) {
    console.error('Error fetching optimization rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch optimization rules', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/optimization/rules - Create new optimization rule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      amazon_connection_id,
      brand_id,
      name,
      rule_type,
      enabled = true,
      conditions,
      actions,
      schedule = 'DAILY',
      custom_cron,
      priority = 0
    } = body;

    // Validate required fields
    if (!amazon_connection_id || !name || !rule_type || !conditions || !actions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user owns this connection
    const connection = await prisma.$queryRaw`
      SELECT * FROM amazon_connections
      WHERE id = ${parseInt(amazon_connection_id)}
      AND user_id = ${parseInt(session.user.id)}
    `;

    if (!Array.isArray(connection) || connection.length === 0) {
      return NextResponse.json(
        { error: 'Amazon connection not found or unauthorized' },
        { status: 404 }
      );
    }

    // Calculate next run time
    const nextRunAt = calculateNextRun(schedule, custom_cron);

    const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await prisma.$executeRaw`
      INSERT INTO profile_optimization_rules (
        id, amazon_connection_id, user_id, brand_id, name, rule_type,
        enabled, conditions, actions, schedule, custom_cron, priority,
        next_run_at, created_at, updated_at
      ) VALUES (
        ${ruleId}, ${parseInt(amazon_connection_id)}, ${parseInt(session.user.id)},
        ${brand_id ? parseInt(brand_id) : null}, ${name}, ${rule_type},
        ${enabled}, ${JSON.stringify(conditions)}::jsonb, ${JSON.stringify(actions)}::jsonb,
        ${schedule}, ${custom_cron}, ${priority}, ${nextRunAt}, NOW(), NOW()
      )
    `;

    const newRule = await prisma.$queryRaw`
      SELECT * FROM profile_optimization_rules WHERE id = ${ruleId}
    `;

    return NextResponse.json({
      success: true,
      rule: Array.isArray(newRule) ? newRule[0] : newRule
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating optimization rule:', error);
    return NextResponse.json(
      { error: 'Failed to create optimization rule', details: error.message },
      { status: 500 }
    );
  }
}

function calculateNextRun(schedule: string, customCron?: string): Date {
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
    case 'CUSTOM':
      // Implement cron parser here if needed
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}
