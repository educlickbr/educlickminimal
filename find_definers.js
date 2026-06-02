const fs = require('fs')
const path = require('path')

const dir = './supabase/migrations'
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql'))

const functions = new Set()

files.forEach(file => {
  const content = fs.readFileSync(path.join(dir, file), 'utf8')
  // Match CREATE OR REPLACE FUNCTION ... SECURITY DEFINER
  // Actually, just find blocks of CREATE FUNCTION and see if they have SECURITY DEFINER
  const regex = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(public\.[a-zA-Z0-9_]+)\b[^$]*\$\$(?:[^$]|\$[^$])*\$\$(?:\s+LANGUAGE\s+\w+)?\s+SECURITY\s+DEFINER|CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(public\.[a-zA-Z0-9_]+)[\s\S]*?SECURITY\s+DEFINER/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    functions.add(match[1] || match[2])
  }
})

console.log(Array.from(functions).join('\n'))
