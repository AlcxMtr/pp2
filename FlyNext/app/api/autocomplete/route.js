import { prisma } from "@/utils/db";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req) {
  const query = req.nextUrl.searchParams.get("query");

  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    // Search for cities
    const cities = await prisma.city.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
      select: { id: true, name: true },
      take: 5,
    });

    // Search for airports
    const airports = await prisma.airport.findMany({
      where: {
        OR: [
          { code: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, code: true },
      take: 5,
    });


    const suggestions = [
      ...cities.map((city) => ({
        id: city.id,
        name: city.name,
        type: "city",
      })),
      ...airports.map((airport) => ({
        id: airport.id,
        name: `${airport.name} (${airport.code})`,
        type: "airport",
      })),
    ];

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json({ message: "Failed to fetch suggestions" }, { status: 500 });
  }
}