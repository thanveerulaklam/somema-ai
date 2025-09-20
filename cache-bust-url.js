// Generate cache-busting URL for editor
const postId = 'a5ae53f3-99f3-46e1-8140-9cc8da9cf055'
const timestamp = Date.now()

console.log('=== CACHE BUSTING URL ===')
console.log('Original URL:')
console.log(`http://localhost:3000/posts/editor?postId=${postId}`)
console.log('\nCache-busting URL:')
console.log(`http://localhost:3000/posts/editor?postId=${postId}&t=${timestamp}`)
console.log('\nTry the cache-busting URL to force a fresh load!') 