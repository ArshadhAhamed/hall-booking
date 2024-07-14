const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(bodyParser.json());

let rooms = [];
let bookings = [];

// 1. Create a Room
app.post('/rooms', (req, res) => {
    const { numberOfSeats, amenities, pricePerHour } = req.body;
    const room = { id: uuidv4(), numberOfSeats, amenities, pricePerHour };
    rooms.push(room);
    res.status(201).json(room);
});

// 2. Book a Room
app.post('/bookings', (req, res) => {
    const { customerName, date, startTime, endTime, roomId } = req.body;

    // Check if the room exists
    const room = rooms.find(r => r.id === roomId);
    if (!room) {
        return res.status(400).json({ error: 'Room not found' });
    }

    // Check for double booking
    const isDoubleBooked = bookings.some(booking => 
        booking.roomId === roomId && booking.date === date &&
        ((startTime >= booking.startTime && startTime < booking.endTime) ||
        (endTime > booking.startTime && endTime <= booking.endTime))
    );

    if (isDoubleBooked) {
        return res.status(400).json({ error: 'Room is already booked for the given time' });
    }

    const booking = { id: uuidv4(), customerName, date, startTime, endTime, roomId, bookingDate: new Date(), bookingStatus: 'confirmed' };
    bookings.push(booking);
    res.status(201).json(booking);
});

// 3. List all Rooms with Booked Data
app.get('/rooms', (req, res) => {
    const roomBookings = rooms.map(room => {
        const bookedData = bookings.filter(booking => booking.roomId === room.id).map(booking => ({
            customerName: booking.customerName,
            date: booking.date,
            startTime: booking.startTime,
            endTime: booking.endTime
        }));
        return { ...room, bookedData };
    });
    res.json(roomBookings);
});

// 4. List all Customers with Booked Data
app.get('/customers', (req, res) => {
    const customers = bookings.map(booking => {
        const room = rooms.find(room => room.id === booking.roomId);
        return {
            customerName: booking.customerName,
            roomName: room ? room.id : 'Unknown',
            date: booking.date,
            startTime: booking.startTime,
            endTime: booking.endTime,
        };
    });
    res.json(customers);
});

// 5. List how many times a customer has booked the room
app.get('/customers/:customerName/bookings', (req, res) => {
    const { customerName } = req.params;
    const customerBookings = bookings.filter(booking => booking.customerName === customerName).map(booking => ({
        roomName: rooms.find(room => room.id === booking.roomId)?.id || 'Unknown',
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        bookingId: booking.id,
        bookingDate: booking.bookingDate,
        bookingStatus: booking.bookingStatus
    }));
    res.json(customerBookings);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
