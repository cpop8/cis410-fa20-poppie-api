const bcrypt = require('bcryptjs')

var hashedPassword = bcrypt.hashSync('password1')

console.log(hashedPassword)

var hashTest = bcrypt.compareSync('password1', hashedPassword)
console.log(hashTest)