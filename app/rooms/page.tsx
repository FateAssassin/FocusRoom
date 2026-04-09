import { getRooms } from "../lib/rooms/rooms";
import Link from "next/link";

export default async function RoomsPage() {
    const rooms = getRooms();
    return (
        <>
        <div>
            <div className="h-screen justify-center items-center flex">    
                <div>
                    <p className="text-center text-2xl font-semibold">Rooms</p>
                    <div className="flex gap-20 mt-10">
                        <div>
                            <div className="card w-[20vw] mb-5">
                                <p className="text-lg mb-4">Create room</p>
                                <div className="flex  items-center justify-center">
                                    <Link href='/rooms/create' className="button-main w-full text-sm text-white/90 text-center"><i className="bi bi-plus mr-2"></i>Create Room</Link>
                                </div>
                            </div>

                            <div className="card w-[20vw]">
                                <p className="text-lg mb-4">Join room</p>
                                <div className="block">
                                    <input maxLength={10} type="text" placeholder="Enter room code" className="uppercase w-full placeholder:text-gray-400 border border-gray-300 p-2 rounded-lg mb-2 text-sm font-light placeholder:normal-case focus:border-blue-500" /><br />
                                    <button className="button-secondary w-full"><i className="bi bi-search mr-2"></i>Join</button>
                                </div>
                            </div>

                        </div>

                        <div className="w-[20vw]">
                            <p className="text-lg font-semibold mb-2">Available Rooms</p>
                            <input type="text" placeholder="Search rooms..." className="placeholder:text-gray-400 border w-full border-gray-300 p-2 rounded-lg mb-4 text-sm font-light placeholder:normal-case focus:border-blue-500" />
                            <hr className="w-full mb-4 text-gray-400" />
                            {rooms.map((room) => (
                                <div key={room.id} className="border p-5 rounded-lg">
                                    <p className="font-semibold">{room.name}</p>
                                    <p className="text-sm text-gray-500">{room.description}</p>
                                    <a href={`/rooms/${room.id}`} className="text-blue-500 text-sm">Join Room</a>
                                </div>
                            ))}
                            {rooms.length === 0 && <p className="text-gray-500">No rooms available. <br /> Create one!</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}
