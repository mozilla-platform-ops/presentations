import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const dist = new URL('../dist/', import.meta.url)

async function patchFile(path) {
  let text = await readFile(path, 'utf8')
  text = text.replaceAll('./presenter/', '/presenter/')
  await writeFile(path, text)
}

await patchFile(new URL('index.html', dist))
await patchFile(new URL('404.html', dist))

for (const file of await readdir(new URL('assets/', dist))) {
  if (file.startsWith('index-') && file.endsWith('.js'))
    await patchFile(join(dist.pathname, 'assets', file))
}
