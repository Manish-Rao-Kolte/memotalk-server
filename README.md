# Memo Talk server

This is a server configuration for Memo Talk Web App. It communicates with databse and serves the data to client on API calls. I also has Socket.IO integrated for websockets.

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`PORT`

`CLIENT_URL`

`MONGODB_URI`

`CLOUDINARY_API_KEY`

`CLOUDINARY_API_SECRET`

`ACCESS_TOKEN_SECRET`

`ACCESS_TOKEN_EXPIRY`

`REFRESH_TOKEN_SECRET`

`REFRESH_TOKEN_EXPIRY`

`REDIS_HOST`

`REDIS_PASSWORD`

`REDIS_PORT`

## Run Locally

Clone the project

```bash
  git clone https://github.com/Manish-Rao-Kolte/memotalk-server
```

Go to the project directory

```bash
  cd memotalk-server
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run start
```

Or to start with nodemon

```bash
  npm run dev
```

## Deployment

Server is deployed on Render

```bash
  https://memotalk-server.onrender.com
```

## Tech Stack

**Server:** Node, Express, Socket.io

**Database:** MongoDB, Mongoose, Cloudinary, Redis

**Other:** Multer, Jsonwebtoken, Bcryptjs

## Roadmap

- Upcoming additional features like group chat, dark mode, profile customization etc.

- Add more integrations

## Authors

- [Manish Rao Kolte](https://github.com/Manish-Rao-Kolte)

## 🚀 About Me

I'm an aspiring full(MERN) stack developer. Currently implementing the knowledge I've gained from Coding Ninjas and creating some useful web apps.
