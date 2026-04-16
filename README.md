# User System

Simple & Secure user system

## Stack

Front :<br>
-React<br>
-Tailwind 4<br>

Back :<br>
-Next.js<br>
-MariaDB<br>
-Prisma<br>
-JsonWebToken<br>
-Argon2<br>

## Features

-Register Users<br>
-Login<br>

## CURL Commands (Testing API)

### Create / Register New User

```curl -X POST -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\", \"password\":\"Test2Test#\", \"username\":\"testUser2\"}" http://localhost:3000/api/users/register```

### Create New User (Weak Password)

```curl -X POST -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\", \"password\":\"test2\", \"username\":\"testUser2\"}" http://localhost:3000/api/users/register```

### Get Users

```curl http://localhost:3000/api/users```

### Get User by ID

```curl http://localhost:3000/api/users?id=1```

### Update User

```curl -X PUT -H "Content-Type: application/json" -d "{\"status\":\"SUSPENDED\"}" http://localhost:3000/api/users?id=1```

### Delete User

```curl -X DELETE http://localhost:3000/api/users?id=1&hard=false```
