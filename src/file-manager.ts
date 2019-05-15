import { Shape, Circle, Rectangle } from "./shape"
import { getCoordWithZoom } from "./utils";

export class FileManagerFactory {

    static getFileManager(fileName: string): FileManager{
        const elems = fileName.split('.');
        const extension = elems[1];

        switch(extension){
            case 'xml':
                return new XMLFileManager();
            case 'txt':
                return new TXTFileManager(); 
        }

        throw 'Unsupported file extension';
    }
}

export interface FileManager {
    save(objs: Array<Shape>, path: string): void
    load(data: string): Array<Shape>
}

export class XMLFileManager implements FileManager {

    save(objs: Array<Shape>, path: string): string {
        let data = "<simpledrawdocument>\n";
        for (const shape of objs) {
            let shapeData;
            if (shape instanceof Rectangle) {
                shapeData = `<rectangle>\n<x>${shape.x}</x>\n<y>${shape.y}</y>\n<width>${shape.width}</width>\n<height>${shape.height}</height>\n</rectangle>`
            } else if (shape instanceof Circle) {
                shapeData = `<circle>\n<x>${shape.x}</x>\n<y>${shape.y}</y>\n<radius>${shape.radius}</radius>\n</circle>`
            }
            data += shapeData+"\n";
        }
        data += "</simpledrawdocument>";
        return data;
    }

    load(data: string): Array<Shape> {
        let model: Array<Shape> = [];
      
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, "text/xml")

        if(xmlDoc.documentElement.nodeName != 'simpledrawdocument')
            throw 'Invalid file';
        
        for(let docShape of xmlDoc.documentElement.children){
            let shape = null;
            if(docShape.nodeName === 'rectangle'){
                const x = parseFloat(docShape.children[0].firstChild.nodeValue)
                const y = parseFloat(docShape.children[1].firstChild.nodeValue)
                const w = parseFloat(docShape.children[2].firstChild.nodeValue)
                const h = parseFloat(docShape.children[3].firstChild.nodeValue)
                shape = new Rectangle(x,y,w,h)
            }
            else if(docShape.nodeName === 'circle'){
                const x = parseFloat(docShape.children[0].firstChild.nodeValue)
                const y = parseFloat(docShape.children[1].firstChild.nodeValue)
                const r = parseFloat(docShape.children[2].firstChild.nodeValue)
                shape = new Circle(x,y,r);
            }
            if(shape !== null)
                model.push(shape);
            else{
                console.warn("Failed to read node: "+docShape.nodeName);
            }
        } 
        return model;
    }
}

export class TXTFileManager implements FileManager {

    save(objs: Array<Shape>, path: string): string {
        let data = "[simpledrawdocument]\n";
        for (const shape of objs) {
            let shapeData;
            if (shape instanceof Rectangle) {
                shapeData = `rectangle ${shape.x} ${shape.y} ${shape.width} ${shape.height}`
            } else if (shape instanceof Circle) {
                shapeData = `circle ${shape.x} ${shape.y} ${shape.radius}`
            }
            data += shapeData+"\n";
        }
       return data;
    }

    load(data: string): Array<Shape> {
        let model: Array<Shape> = [];
      
        const lines = data.split('\n');
        if(lines[0] != '[simpledrawdocument]')
            throw 'Invalid file';

        for(let i = 0; i < lines.length; i++){
            if(i == 0)
                continue;

            const line = lines[i];
            let shape = null;
            const tokens = line.split(' ');
            if(tokens[0] === 'rectangle' && tokens.length == 5){
                const x = parseFloat(tokens[1])
                const y = parseFloat(tokens[2])
                const w = parseFloat(tokens[3])
                const h = parseFloat(tokens[4])
                shape = new Rectangle(x,y,w,h)
            }
            else if(tokens[0] === 'circle' && tokens.length == 4){
                const x = parseFloat(tokens[1])
                const y = parseFloat(tokens[2])
                const r = parseFloat(tokens[3])
                shape = new Circle(x,y,r);
            }

            if(shape !== null)
                model.push(shape);
            else{
                console.warn("Failed to read node: "+tokens[0]);
            }
        } 
        return model;
    }
}