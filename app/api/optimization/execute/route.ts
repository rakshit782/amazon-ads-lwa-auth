import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { OptimizationEngine } from '@/lib/optimization/engine';

const prisma = new PrismaClient();

// POST /api/optimization/execute - Manually execute an optimization rule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ruleId } = body;

    if (!ruleId) {
      return NextResponse.json({ error: 'Rule ID required' }, { status: 400 });
    }

    // Verify ownership
    const rule = await prisma.$queryRaw`
      SELECT * FROM profile_optimization_rules
      WHERE id = ${ruleId}
      AND user_id = ${parseInt(session.user.id)}
    `;

    if (!Array.isArray(rule) || rule.length === 0) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    const ruleData: any = rule[0];

    if (!ruleData.enabled) {
      return NextResponse.json(
        { error: 'Rule is disabled' },
        { status: 400 }
      );
    }

    // Get connection details
    const connection = await prisma.$queryRaw`
      SELECT * FROM amazon_connections
      WHERE id = ${ruleData.amazon_connection_id}
    `;

    if (!Array.isArray(connection) || connection.length === 0) {
      return NextResponse.json(
        { error: 'Amazon connection not found' },
        { status: 404 }
      );
    }

    const connectionData: any = connection[0];

    // Execute optimization
    const engine = new OptimizationEngine();
    const result = await engine.executeRule(ruleData, connectionData);

    return NextResponse.json({
      success: true,
      execution: result
    });
  } catch (error: any) {
    console.error('Error executing optimization rule:', error);
    return NextResponse.json(
      { error: 'Failed to execute optimization rule', details: error.message },
      { status: 500 }
    );
  }
}
