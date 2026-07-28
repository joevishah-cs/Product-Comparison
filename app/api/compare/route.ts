import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

interface ComparisonRequest {
  productIds: string[];
}

interface AttributeComparison {
  key: string;
  values: Record<string, { raw: string; numeric: number | null; source: string | null }>;
  direction: "higher" | "lower" | "neutral";
}

interface CompetitiveScore {
  productId: string;
  score: number; // 0-100
  strengths: string[];
  weaknesses: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ComparisonRequest = await request.json();
    const { productIds } = body;

    if (!productIds || productIds.length < 2) {
      return NextResponse.json({ error: "At least 2 products required" }, { status: 400 });
    }

    // Fetch selected products with all their attributes
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        brand: true,
        family: true,
        values: {
          include: {
            definition: true,
          },
        },
      },
    });

    if (products.length === 0) {
      return NextResponse.json({ error: "No products found" }, { status: 404 });
    }

    // Build attribute comparison matrix
    const allAttributes = new Map<
      string,
      { definition: any; values: Record<string, { raw: string; numeric: number | null; source: string | null }> }
    >();

    for (const product of products) {
      for (const value of product.values) {
        if (!allAttributes.has(value.definition.key)) {
          allAttributes.set(value.definition.key, {
            definition: value.definition,
            values: {},
          });
        }

        const numeric = extractNumeric(value.normalizedValue || value.rawValue);
        allAttributes.get(value.definition.key)!.values[product.id] = {
          raw: value.normalizedValue || value.rawValue,
          numeric,
          source: value.sourceLocation || null,
        };
      }
    }

    // Calculate competitive scores per product
    const scores = calculateScores(products, allAttributes);

    // Transform to response format
    const comparison = {
      products: products.map((p) => ({
        id: p.id,
        brand: p.brand.name,
        model: p.model,
      })),
      attributes: Array.from(allAttributes.entries()).map(([key, data]) => ({
        key,
        label: data.definition.label,
        category: data.definition.category,
        direction: data.definition.comparisonDirection,
        values: data.values,
      })),
      scores,
      overallSimilarity: calculateSimilarity(allAttributes, products),
    };

    return NextResponse.json(comparison);
  } catch (error) {
    console.error("Error comparing products:", error);
    return NextResponse.json({ error: "Failed to compare products" }, { status: 500 });
  }
}

function extractNumeric(value: string): number | null {
  if (!value) return null;
  const match = value.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function calculateScores(products: any[], attributes: Map<string, any>): CompetitiveScore[] {
  const scores: CompetitiveScore[] = [];

  for (const product of products) {
    let score = 0;
    let maxScore = 0;
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    for (const [attrKey, attrData] of attributes) {
      const productValue = attrData.values[product.id];
      if (!productValue || productValue.numeric === null) continue;

      maxScore += 10;

      // Score based on direction
      const otherValues = Object.entries(attrData.values)
        .filter(([pid]) => pid !== product.id)
        .map(([, v]: [string, any]) => v.numeric)
        .filter((n) => n !== null) as number[];

      if (otherValues.length === 0) continue;

      const isHigherBetter = attrData.definition.comparisonDirection === "higher";
      const avgOther = otherValues.reduce((a, b) => a + b, 0) / otherValues.length;
      const currentValue = productValue.numeric;

      if (isHigherBetter) {
        if (currentValue > avgOther) {
          score += 10;
          strengths.push(attrKey);
        } else if (currentValue < avgOther) {
          weaknesses.push(attrKey);
        } else {
          score += 5;
        }
      } else {
        if (currentValue < avgOther) {
          score += 10;
          strengths.push(attrKey);
        } else if (currentValue > avgOther) {
          weaknesses.push(attrKey);
        } else {
          score += 5;
        }
      }
    }

    scores.push({
      productId: product.id,
      score: maxScore > 0 ? Math.round((score / maxScore) * 100) : 50,
      strengths: [...new Set(strengths)],
      weaknesses: [...new Set(weaknesses)],
    });
  }

  return scores;
}

function calculateSimilarity(attributes: Map<string, any>, products: any[]): number {
  let matchingAttributes = 0;
  let totalAttributes = 0;

  for (const [, attrData] of attributes) {
    const productValues = products.map((p) => attrData.values[p.id]);
    const availableCount = productValues.filter((v) => v && v.numeric !== null).length;

    if (availableCount >= products.length * 0.8) {
      totalAttributes++;

      const values = productValues.map((v) => v?.numeric).filter((v) => v !== null);
      if (values.length > 1) {
        const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
        const deviation = values.reduce((sum, v) => sum + Math.abs(v - avgValue), 0) / values.length;
        const variance = deviation / avgValue;

        if (variance < 0.15) {
          matchingAttributes++;
        }
      }
    }
  }

  return totalAttributes > 0 ? Math.round((matchingAttributes / totalAttributes) * 100) : 0;
}
