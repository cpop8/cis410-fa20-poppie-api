const bcrypt = require('bcryptjs')

var hashedPassword = bcrypt.hashSync('gaskp34')

console.log(hashedPassword)

var hashTest = bcrypt.compareSync('gaskp34', hashedPassword)
console.log(hashTest)