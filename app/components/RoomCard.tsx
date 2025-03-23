interface Room {
    id: string;
    name: string;
    pricePerNight: number;
    availableRooms: number;
    amenities: string[];
    images: string[];
  }
  
  export default function RoomCard({ room }: { room: Room }) {
    return (
      <div className="room-card">
        <h2 className="room-title">{room.name}</h2>
        <p className="room-price">${room.pricePerNight}/night</p>
        <p className="room-availability">Available: {room.availableRooms}</p>
        <p className="room-amenities">Amenities: {room.amenities.join(', ')}</p>
      </div>
    );
  }