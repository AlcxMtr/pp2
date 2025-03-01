export async function getAvailableRooms(roomTypeId, checkInDate, checkOutDate) {
    const totalRooms = await prisma.roomType.findUnique({
        where: { id: roomTypeId },
        select: { totalRooms: true },
    });

    if (!totalRooms) {
        throw new Error('Room type not found');
    }

    const bookedRooms = await prisma.hotelBooking.count({
        where: {
        roomTypeId,
        status: 'CONFIRMED',
        OR: [
            {
            checkInDate: { lt: checkOutDate },
            checkOutDate: { gt: checkInDate },
            },
        ],
        },
    });

    return totalRooms.totalRooms - bookedRooms;
}