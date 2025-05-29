# Find Mentor Platform 🎓

A modern web-based platform that revolutionizes online mentoring by connecting students with expert mentors through real-time video sessions. Our platform makes learning personal, accessible, and effective.

## ✨ Key Features

### 🎥 Video Mentoring
- Real-time HD video conferencing powered by WebRTC
- Screen sharing capabilities for interactive learning
- Built-in chat functionality during sessions

### 🔐 Security & Authentication
- Secure user authentication system
- Role-based access control (Student/Mentor)
- End-to-end encrypted video calls

### 👥 User Management
- Comprehensive mentor profiles
- Advanced scheduling system
- Session history tracking
- Rating and review system

### 💻 Technical Features
- Responsive design using Bootstrap 5
- Real-time updates with Socket.IO
- Firebase backend integration
- Cross-browser compatibility

## Tech Stack

- HTML5, CSS3, JavaScript
- Bootstrap 5 for UI components
- Socket.IO for real-time communication
- Firebase for authentication and database
- Node.js backend

## Project Structure

```
├── backend/
│   └── firebase/
│       ├── config.js
│       └── userService.js
├── frontend/
│   ├── assets/
│   ├── choose-role.html
│   ├── login.html
│   ├── mentor_dashboard.html
│   ├── student_dashboard.html
│   └── video_call.html
├── home.html
├── server.js
└── socket.io.js
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)
- Modern web browser (Chrome, Firefox, Safari, or Edge)

### Installation

1. Clone the repository
```sh
git clone https://github.com/ShivamRamola/Find-Mentor.git
cd Find-Mentor
```

2. Install dependencies
```sh
npm install
```

3. Set up Firebase:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication and Realtime Database
   - Add your Firebase configuration to `backend/firebase/config.js`:
     ```js
     const firebaseConfig = {
       apiKey: "your-api-key",
       authDomain: "your-auth-domain",
       projectId: "your-project-id",
       // ... other config
     };
     ```

4. Start the development server:
```sh
npm start
```

5. Open your browser and navigate to:
```
http://localhost:3000
```

## Features

### For Students
- Find and connect with expert mentors
- Schedule mentoring sessions
- Real-time video calls
- Track learning progress

### For Mentors
- Create mentor profile
- Manage mentoring sessions
- Connect with students
- Video conferencing tools

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License.#
