import { readFile, readdir, writeFile, mkdir, createWriteStream, readdirSync, readFileSync, mkdirSync, rmdirSync } from "fs"
import { join } from "path"
import { fork, isMaster, on } from "cluster"
import { cpus, EOL } from "os"

interface svgElement {
   name: string
   data: string
}

let sourceDir: string
let outputDir: string
let outputDirIcons: string
let outputDirExports: string

let svgNameArray: svgElement[] = []
let iconSetName: string = ""

function main(iconSetName: string) {
   iconSetName = iconSetName
   sourceDir = "./icons/" + iconSetName
   outputDir = "./output/" + iconSetName
   outputDirIcons = outputDir + "/icons"
   outputDirExports = outputDir + "/index.js"

   mkdirSync(outputDirIcons, { recursive: true })
   svgNameArray = getNameArray()
   generateSvelteIcons()
   generateExportsFile()
   //mkdir(outputDirExports, { recursive: true }, () => {})
}

function generateExportsFile() {
   const logger = createWriteStream(outputDirExports, { flags: "a" })

   getNameArray().forEach(({ name }) => {
      logger.write(`export { default as ${name} } from './icons/${name}.svelte'`)
      logger.write(EOL)
   })

   logger.end()
}

function generateSvelteIcons() {
   svgNameArray.forEach(element => {
      writeToSvelteFile(element.name, element.data)
   })
}

function getNameArray() {
   return readdirSync(sourceDir)
      .map(svgFolder => {
         return readdirSync(join(sourceDir, svgFolder)).map(svgFileName => ({
            name: convertName(svgFileName),
            data: readFileSync(join(sourceDir, svgFolder, svgFileName)).toString()
         }))
      })
      .flat()
}

function writeToSvelteFile(name: string, data: string) {
   writeFile(getSvelteFileUrl(name), getConvertedSvelteData(data), (err: any) => {
      if (err) throw new Error(err)
   })
}

function getSvelteFileUrl(name: string): string {
   return outputDirIcons + "/" + name + "Icon" + ".svelte"
}

function convertName(badName: string): string {
   const nameWithoutExtension = badName.replace(".svg", "")
   const splittedName = nameWithoutExtension.split("-")
   let joinedName: string = splittedName.map(e => e[0].toUpperCase() + e.slice(1)).join("")

   if (!isNaN(joinedName.charAt(0) as any)) {
      joinedName = "Game" + joinedName
   }
   return joinedName
}

function getConvertedSvelteData(data: string): string {
   const convertedData = data.replace('fill="#000"', 'fill="currentColor"')
   return convertedData
}

main("game-icons")
