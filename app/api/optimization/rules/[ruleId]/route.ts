import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/optimization/rules/[ruleId] - Get specific rule
export async function GET(
  request: NextRequest,
  { params }: { params: { ruleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ruleId } = params;

    const rule = await prisma.$queryRaw`
      SELECT * FROM profile_optimization_rules
      WHERE id = ${ruleId}
      AND user_id = ${parseInt(session.user.id)}
    `;

    if (!Array.isArray(rule) || rule.length === 0) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, rule: rule[0] });
  } catch (error: any) {
    console.error('Error fetching rule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rule', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/optimization/rules/[ruleId] - Update rule
export async function PATCH(
  request: NextRequest,
  { params }: { params: { ruleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ruleId } = params;
    const body = await request.json();

    // Verify ownership
    const existing = await prisma.$queryRaw`
      SELECT * FROM profile_optimization_rules
      WHERE id = ${ruleId}
      AND user_id = ${parseInt(session.user.id)}
    `;

    if (!Array.isArray(existing) || existing.length === 0) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (body.name !== undefined) {
      updates.push('name = $' + (values.length + 1));
      values.push(body.name);
    }
    if (body.enabled !== undefined) {
      updates.push('enabled = $' + (values.length + 1));
      values.push(body.enabled);
    }
    if (body.conditions !== undefined) {
      updates.push('conditions = $' + (values.length + 1) + '::jsonb');
      values.push(JSON.stringify(body.conditions));
    }
    if (body.actions !== undefined) {
      updates.push('actions = $' + (values.length + 1) + '::jsonb');
      values.push(JSON.stringify(body.actions));
    }
    if (body.schedule !== undefined) {
      updates.push('schedule = $' + (values.length + 1));
      values.push(body.schedule);
    }
    if (body.priority !== undefined) {
      updates.push('priority = $' + (values.length + 1));
      values.push(body.priority);
    }

    updates.push('updated_at = NOW()');

    if (updates.length > 0) {
      await prisma.$executeRawUnsafe(`
        UPDATE profile_optimization_rules
        SET ${updates.join(', ')}
        WHERE id = '${ruleId}'
      `);
    }

    const updatedRule = await prisma.$queryRaw`
      SELECT * FROM profile_optimization_rules
      WHERE id = ${ruleId}
    `;

    return NextResponse.json({
      success: true,
      rule: Array.isArray(updatedRule) ? updatedRule[0] : updatedRule
    });
  } catch (error: any) {
    console.error('Error updating rule:', error);
    return NextResponse.json(
      { error: 'Failed to update rule', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/optimization/rules/[ruleId] - Delete rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: { ruleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ruleId } = params;

    // Verify ownership
    const existing = await prisma.$queryRaw`
      SELECT * FROM profile_optimization_rules
      WHERE id = ${ruleId}
      AND user_id = ${parseInt(session.user.id)}
    `;

    if (!Array.isArray(existing) || existing.length === 0) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    await prisma.$executeRaw`
      DELETE FROM profile_optimization_rules
      WHERE id = ${ruleId}
    `;

    return NextResponse.json({ success: true, message: 'Rule deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete rule', details: error.message },
      { status: 500 }
    );
  }
}
