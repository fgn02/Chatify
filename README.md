# Chatify

## Overview
Chatify is a full-featured real-time chat application built with Vanilla JavaScript, Node.js, and Socket.IO. The project uses MySQL for database management and offers a sleek and user-friendly interface. Users can register, sign in, and interact with each other through messages, attachments, and emojis. It also includes user settings for personalization and a dashboard for recent chats and group chats. Future updates will include a call feature.

![Sample GIF](https://i.ibb.co/4j38FJx/ezgif-1-c41863263d.gif)

## Project Description

Chatify provides a seamless and intuitive experience for users to connect and communicate in real-time. The platform supports:
- Secure user authentication and registration.
- Real-time messaging with attachments and emojis.
- Group chat functionalities.
- User profile management with customizable settings.

The system is built on a robust backend powered by Node.js and Express, with real-time capabilities enabled by Socket.IO. Data is securely managed in a MySQL database, ensuring reliability and scalability.

## Features

### User Authentication
- **Sign Up**: Users can register by providing their first name, last name, email, and password. Data is securely stored in the MySQL database.
- **Sign In**: Registered users can log in using their email and password.
- **Token-based Authentication**: Ensures secure access to the dashboard and chat functionalities.

### Dashboard
- Displays recent chats with a search bar for quick access.
- Provides options to create new chats or clear all chats.
- Includes a section for group chats with a user-friendly interface to manage and participate in groups.

### Chat Functionalities
- **Real-time Messaging**: Send and receive messages instantly using Socket.IO.
- **Attachments**: Users can share files, images, and other attachments.
- **Emojis**: Integrated emoji picker for more expressive communication.
- **Typing Indicator**: Displays when a user is typing.

### User Settings
- Allows users to update their display name and full name.
- Provides options to customize notification preferences (email and sound notifications).

### Group Chats
- Users can create and join group chats.
- Provides a seamless experience for group conversations with a dedicated group chat interface.

### Profile Management
- Users can view and update their profile information, including changing the profile picture and status.

## Technology Stack
- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Real-time Communication**: Socket.IO
- **Authentication**: JWT (JSON Web Token)

## Future Enhancements
- **Call Feature**: Add voice and video calling functionalities.
- **Improved Group Management**: Features like group admins, member roles, and permissions.
- **Notifications**: Real-time push notifications for new messages.
- **Dark Mode**: Option for a dark-themed interface.

## Installation and Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/chatify.git
   cd chatify
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   - Create a `.env` file in the root directory.
   - Add the following variables:
     ```env
     PORT=5000
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=yourpassword
     DB_NAME=chatify
     JWT_SECRET=your_secret_key
     ```

4. **Set Up Database**:
   - Import the provided `chatify.sql` file into your MySQL database.

5. **Run the Application**:
   ```bash
   npm start
   ```
   The application will be available at `http://localhost:5000`.

## Folder Structure
```
chatify/
├── controllers/
├── middleware/
├── models/
├── public/
│   └── css/
│   └── js/
├── routes/
├── views/
├── .env
├── package.json
├── server.js
└── README.md
```

## Contribution Guidelines
1. Fork the repository.
2. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your commit message"
   ```
4. Push to the branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Create a pull request.

## License
Chatify is
- © Farhan Ishraq Fagun

