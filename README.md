# User System

Simple & Secure Production ready user system<br>
Custom creditentials + OAuth Signin<br>
Unfinished<br>

## Stack

Front :<br>
-[React](https://fr.react.dev/)<br>
-[Tailwind 4](https://tailwindcss.com/)<br>

Back :<br>
-[Next.js](https://nextjs.org/)<br>
-[Auth.js](https://authjs.dev/)<br>
-JWT (JsonWebToken)<br>
-Argon2<br>
-[Prisma](https://www.prisma.io/)<br>
-[MariaDB](https://mariadb.org/)<br>

## Features

-Custom Register Users<br>
-Custom Login<br>
-Signin with OAuth (GitHub only for now)<br>
-Send Mails (using Mailgun)<br>

## Security

-Hash & Salt Passwords<br>
-Blackbox auth Vs Timing Attacks<br>
-IP Rate Limit Vs Brute force Attacks<br>

## CURL Commands : Open routes

### Create / Register User

```curl -X POST -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\", \"password\":\"Test2Test#\", \"username\":\"testUser2\"}" http://localhost:3000/api/users/register```

### Create / Register User (Weak Password)

```curl -X POST -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\", \"password\":\"Test2\", \"username\":\"testUser2\"}" http://localhost:3000/api/users/register```

## CURL Commands : Protected routes

### Read Users

```curl http://localhost:3000/api/users```

### Read User by ID

```curl http://localhost:3000/api/users?id=1```

### Update User

```curl -X PUT -H "Content-Type: application/json" -d "{\"status\":\"SUSPENDED\"}" http://localhost:3000/api/users?id=1```

### Delete User

```curl -X DELETE http://localhost:3000/api/users?id=1&hard=false```

## Progress

![Image]()
