const axios = require('axios');
const cheerio = require('cheerio');
var FormData = require('form-data');
const sqlite3 = require('sqlite3');

const sqlite = require('sqlite');




const url = "https://www.bibliatodo.com/pt/a-biblia/almeida-revista-atualizada-1993/salmos-138"

async function getChapters(name) {
  let data = new FormData();
  data.append('nombre',name)
  data.append('lang', 'portuguese')

  const res = await axios({
    method: 'post',
    url: 'https://www.bibliatodo.com/peticiones_js/cargar_capitulos',
    data: data,
    headers: data.getHeaders()
    })
    return res.data

}

async function getBooks(){
  let booksRes = await axios(url)

  const html = booksRes.data;
  const $ = cheerio.load(html);

  let verses = []
  let books = []
  $('#libros option').each(function(){
    let book = {id: $(this).attr().id, value: $(this).attr().value}

    // let chapter = await getChapters(book.value)
    //   book["chapters"] = chapter
    books.push(book)

  })
  // console.log(books)

  for (const [id, element] of books.entries()) {
    console.log(element.value)
    const chapters = await getChapters(element.value);
    books[id]["chapters"] = chapters;
  }

  return books
}

async function getVersicles(book) {
  const db = await sqlite.open({ filename: './database.sqlite', driver: sqlite3.Database });
  let arr = Array(book.chapters)
  for(const [id] of arr.entries()){
    const capther = id+1

    book_url = `https://www.bibliatodo.com/pt/a-biblia/almeida-revista-atualizada-1993/${book.id}-${capther}`
    let booksRes = await axios(book_url)

    const html = booksRes.data;
    const $ = cheerio.load(html);

    let verses = []
    // console.log('Book chapter', book, id+1)

    $('#imprimible').each(function(){
      $(this).find("#imprimible > p").each(function(){
        verses.push($(this).text())
      })
    })

    // console.log(verses)
    for(const [id, element] of verses.entries()){
      // console.log("Before insert", book, element)
      const versicle_number = parseInt(element.split(".")[0])
      res = await db.run("insert into books (name, chapter, versicle, version, versicle_number) values (?,?,?,?,?)", [book.value, capther, element, 'almeida-revista-atualizada-1993',versicle_number ])
      // console.log(res)
      // console.log($(this).text())
    }

  }
  return 'ok'
}


async function main() {
  const db = await sqlite.open({ filename: './database.sqlite', driver: sqlite3.Database });


  await db.run('create table if not exists books (id integer primary key, name text, chapter integer, versicle text, version text, versicle_number integer)');

  db.close()
  // Url de Exemplo

  let res = await getBooks()

  for (const [id, book] of res.entries()) {
    console.log('Before getVersicles', id, book)
    let res = await getVersicles(book)
  }


}


main()