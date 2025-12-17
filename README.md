# User System

# CURL Commands (Testing) :
## Create New User :
```curl -X POST -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\", \"name\":\"testUser\", \"role\":\"USER\"}" http://localhost:3000/api/users```

## Get Users
```curl http://localhost:3000/api/users```

## Get User by ID
```curl http://localhost:3000/api/users?id=1```

## Update User
```curl -X PUT -H "Content-Type: application/json" -d "{\"status\":\"SUSPENDED\"}" http://localhost:3000/api/users?id=1```

## Delete User
```curl -X DELETE http://localhost:3000/api/users?id=1&hard=false```