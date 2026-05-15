import 'dotenv/config'
import prisma from "./lib/prisma.js"

const employees = [
  {
    name: "Mariana Oliveira Costa",
    street: "Rua Padre Chagas",
    number: 185,
    neighborhood: "Moinhos de Vento",
    city: "Porto Alegre",
    zip_code: "90570-080",
    lat: -30.0250,
    lng: -51.2010,
  },
  {
    name: "Rafael Silveira Machado",
    street: "Avenida Protásio Alves",
    number: 5000,
    neighborhood: "Petrópolis",
    city: "Porto Alegre",
    zip_code: "90410-006",
    lat: -30.0410,
    lng: -51.1850,
  },
  {
    name: "Camila Pereira Fontes",
    street: "Avenida Assis Brasil",
    number: 1842,
    neighborhood: "Passo d'Areia",
    city: "Porto Alegre",
    zip_code: "91010-002",
    lat: -30.0030,
    lng: -51.1730,
  },
  {
    name: "Lucas Almeida Rocha",
    street: "Avenida Wenceslau Escobar",
    number: 1823,
    neighborhood: "Tristeza",
    city: "Porto Alegre",
    zip_code: "91900-000",
    lat: -30.1130,
    lng: -51.2390,
  },
  {
    name: "Beatriz Cardoso Lima",
    street: "Avenida Bento Gonçalves",
    number: 4500,
    neighborhood: "Partenon",
    city: "Porto Alegre",
    zip_code: "90650-002",
    lat: -30.0590,
    lng: -51.1700,
  },
  {
    name: "Henrique Borges Martins",
    street: "Avenida Plínio Brasil Milano",
    number: 1326,
    neighborhood: "Higienópolis",
    city: "Porto Alegre",
    zip_code: "90520-003",
    lat: -30.0140,
    lng: -51.1980,
  },
  {
    name: "Patrícia Souza Vargas",
    street: "Avenida Sertório",
    number: 6600,
    neighborhood: "Sarandi",
    city: "Porto Alegre",
    zip_code: "91020-001",
    lat: -29.9810,
    lng: -51.1330,
  },
  {
    name: "Eduardo Nunes Ribeiro",
    street: "Rua Anita Garibaldi",
    number: 1500,
    neighborhood: "Mont'Serrat",
    city: "Porto Alegre",
    zip_code: "90450-001",
    lat: -30.0260,
    lng: -51.1900,
  },
]

const works = [
  {
    name: "Obra Edifício Praia de Belas",
    street: "Avenida Praia de Belas",
    number: 1181,
    neighborhood: "Praia de Belas",
    city: "Porto Alegre",
    zip_code: "90110-001",
    lat: -30.0530,
    lng: -51.2270,
  },
  {
    name: "Obra Residencial Auxiliadora",
    street: "Avenida Carlos Gomes",
    number: 1672,
    neighborhood: "Auxiliadora",
    city: "Porto Alegre",
    zip_code: "90480-002",
    lat: -30.0250,
    lng: -51.1940,
  },
  {
    name: "Obra Comercial Centro Histórico",
    street: "Rua dos Andradas",
    number: 1234,
    neighborhood: "Centro Histórico",
    city: "Porto Alegre",
    zip_code: "90020-008",
    lat: -30.0290,
    lng: -51.2280,
  },
  {
    name: "Obra Condomínio Cidade Baixa",
    street: "Avenida João Pessoa",
    number: 1306,
    neighborhood: "Cidade Baixa",
    city: "Porto Alegre",
    zip_code: "90040-001",
    lat: -30.0410,
    lng: -51.2230,
  },
  {
    name: "Obra Galpão Logístico Anchieta",
    street: "Avenida Frederico Ritter",
    number: 1100,
    neighborhood: "Anchieta",
    city: "Porto Alegre",
    zip_code: "90200-310",
    lat: -29.9760,
    lng: -51.1750,
  },
  {
    name: "Obra Reforma Independência",
    street: "Avenida Independência",
    number: 925,
    neighborhood: "Independência",
    city: "Porto Alegre",
    zip_code: "90035-077",
    lat: -30.0270,
    lng: -51.2030,
  },
  {
    name: "Obra Torre Floresta",
    street: "Avenida Cristóvão Colombo",
    number: 545,
    neighborhood: "Floresta",
    city: "Porto Alegre",
    zip_code: "90560-002",
    lat: -30.0170,
    lng: -51.2110,
  },
  {
    name: "Obra Empreendimento Boa Vista",
    street: "Avenida Nilo Peçanha",
    number: 1600,
    neighborhood: "Boa Vista",
    city: "Porto Alegre",
    zip_code: "91330-001",
    lat: -30.0270,
    lng: -51.1860,
  },
]

async function main() {
  for (const e of employees) {
    await prisma.employee.upsert({
      where: { name: e.name },
      update: e,
      create: e,
    })
  }

  for (const w of works) {
    await prisma.work.upsert({
      where: { name: w.name },
      update: w,
      create: w,
    })
  }

  console.log(`Seeded ${employees.length} employees and ${works.length} works.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (err) => {
    console.error(err)
    await prisma.$disconnect()
    process.exit(1)
  })
