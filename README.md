# User System

Simple & Secure user system named Thedas

## Stack

Front :<br>
-React<br>
-Tailwind 4<br>

Back :<br>
-Next.js<br>
-Auth.js<br>
-JsonWebToken<br>
-Argon2<br>
-Prisma<br>
-MariaDB<br>

## Features

-Register Users<br>
-Login<br>
-Send Mails (using Mailgun)<br>

## Security

-Hash & Salt<br>
-Vs Timing Attacks<br>
-IP Based Lockout<br>

## CURL Commands

### Create / Register New User

```curl -X POST -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\", \"password\":\"Test2Test#\", \"username\":\"testUser2\"}" http://localhost:3000/api/users/register```

### Create New User (Weak Password)

```curl -X POST -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\", \"password\":\"Test2\", \"username\":\"testUser2\"}" http://localhost:3000/api/users/register```

## Staging CURL Commands (Protect routes in Production)

### Read Users

```curl http://localhost:3000/api/users```

### Read User by ID

```curl http://localhost:3000/api/users?id=1```

### Update User

```curl -X PUT -H "Content-Type: application/json" -d "{\"status\":\"SUSPENDED\"}" http://localhost:3000/api/users?id=1```

### Delete User

```curl -X DELETE http://localhost:3000/api/users?id=1&hard=false```
