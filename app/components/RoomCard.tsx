import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Room {
  id: number;
  name: string;
  totalRooms?: number;
  pricePerNight: number;
  amenities: { name: string }[];
  availableRooms?: number;
}

export default function RoomCard({ room, onEdit }: { room: Room; onEdit?: (room: Room) => void }) {
  const { accessToken } = useAuth();

  return (
    <div className="room-card">
      <h3 className="room-name">{room.name}</h3>
      <p className="room-detail">Price: ${room.pricePerNight}/night</p>
      <p className="room-detail">Total Rooms of Type: {room.totalRooms !== undefined ? room.totalRooms : 'N/A'}</p>
      {room.availableRooms !== undefined && (
        <p className="room-detail">Num Rooms Available for Date Range: {room.availableRooms}</p>
      )}
      {room.amenities && room.amenities.length > 0 && (
        <p className="room-detail">Amenities: {room.amenities.map(a => a.name).join(', ')}</p>
      )}
      {accessToken && onEdit && (
        <button onClick={() => onEdit(room)} className="edit-button">
          Edit
        </button>
      )}
    </div>
  );
}