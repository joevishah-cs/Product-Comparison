import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const saved = await prisma.savedComparison.findUnique({ where: { id: params.id } });
    if (!saved) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: saved.id,
      name: saved.name,
      productIds: JSON.parse(saved.productIds || "[]"),
      notes: saved.notes,
      dashboard: saved.dashboard,
      insights: saved.insights,
      battlecard: saved.battlecard,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching saved comparison:", error);
    return NextResponse.json({ error: "Failed to fetch saved comparison" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { name, notes, insights, battlecard } = body;

    const saved = await prisma.savedComparison.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(insights !== undefined ? { insights } : {}),
        ...(battlecard !== undefined ? { battlecard } : {}),
      },
    });

    return NextResponse.json({ id: saved.id });
  } catch (error) {
    console.error("Error updating saved comparison:", error);
    return NextResponse.json({ error: "Failed to update saved comparison" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.savedComparison.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting saved comparison:", error);
    return NextResponse.json({ error: "Failed to delete saved comparison" }, { status: 500 });
  }
}
