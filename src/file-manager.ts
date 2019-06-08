import { Shape, Circle, Rectangle } from "./shape"
import { getCoordWithZoom } from "./utils";

export class FileManagerFactory {

    static getFileManager(fileName: string): FileManager {
        const elems = fileName.split('.');
        const extension = elems[1];

        switch (extension) {
            case 'xml':
                return new XMLFileManager();
            case 'txt':
                return new TXTFileManager();
        }

        throw 'Unsupported file extension';
    }
}

export interface FileManager {
    save(layers: Array<Array<Shape>>, path: string): void
    load(data: string): Array<Array<Shape>>
}

export class XMLFileManager implements FileManager {

    save(layers: Array<Array<Shape>>, path: string): string {
        let data = "<simpledrawdocument>\n";
        for (const objs of layers) {
            data += "<layer>\n"
            for (const shape of objs) {
                let shapeData;
                if (shape instanceof Rectangle) {
                    shapeData = `<rectangle>\n<id>${shape.id}</id>\n<x>${shape.x}</x>\n<y>${shape.y}</y>\n<width>${shape.width}</width>\n<height>${shape.height}</height>\n</rectangle>`
                } else if (shape instanceof Circle) {
                    shapeData = `<circle>\n<id>${shape.id}</id>\n<x>${shape.x}</x>\n<y>${shape.y}</y>\n<radius>${shape.radius}</radius>\n</circle>`
                }
                data += shapeData + "\n";
            }
            data += "</layer>\n"
        }
        data += "</simpledrawdocument>";
        return data;
    }

    load(data: string): Array<Array<Shape>> {
        let model: Array<Array<Shape>> = [];

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, "text/xml")

        if (xmlDoc.documentElement.nodeName != 'simpledrawdocument')
            throw 'Invalid file';
        for (let docLayer of xmlDoc.documentElement.children) {
            if (docLayer.nodeName === 'layer') {
                let layer = new Array<Shape>()
                for (let docShape of docLayer.children) {
                    let shape = null;
                    if (docShape.nodeName === 'rectangle') {
                        const id = parseFloat(docShape.children[0].firstChild.nodeValue)
                        const x = parseFloat(docShape.children[1].firstChild.nodeValue)
                        const y = parseFloat(docShape.children[2].firstChild.nodeValue)
                        const w = parseFloat(docShape.children[3].firstChild.nodeValue)
                        const h = parseFloat(docShape.children[4].firstChild.nodeValue)
                        shape = new Rectangle(id, x, y, w, h)
                    }
                    else if (docShape.nodeName === 'circle') {
                        const id = parseFloat(docShape.children[0].firstChild.nodeValue)
                        const x = parseFloat(docShape.children[1].firstChild.nodeValue)
                        const y = parseFloat(docShape.children[2].firstChild.nodeValue)
                        const r = parseFloat(docShape.children[3].firstChild.nodeValue)
                        shape = new Circle(id, x, y, r);
                    }
                    if (shape !== null)
                        layer.push(shape);
                    else {
                        console.warn("Failed to read node: " + docShape.nodeName);
                    }
                }
                model.push(layer)
            }
        }
        return model;
    }
}

export class TXTFileManager implements FileManager {

    save(layers: Array<Array<Shape>>, path: string): string {
        let data = "[simpledrawdocument]\n";
        for (const objs of layers) {
            data += "[layer]\n"
            for (const shape of objs) {
                let shapeData;
                if (shape instanceof Rectangle) {
                    shapeData = `rectangle ${shape.id} ${shape.x} ${shape.y} ${shape.width} ${shape.height}`
                } else if (shape instanceof Circle) {
                    shapeData = `circle ${shape.id} ${shape.x} ${shape.y} ${shape.radius}`
                }
                data += shapeData + "\n";
            }
        }
        return data;
    }

    load(data: string): Array<Array<Shape>> {
        let model: Array<Array<Shape>> = [];

        const lines = data.split('\n');
        if (lines[0] != '[simpledrawdocument]')
            throw 'Invalid file';

        let layers = new Array<Shape>()
        for (let i = 0; i < lines.length; i++) {
            if (i == 0)
                continue;

            let shape = null;
            if (lines[i] == "[layer]") {
                if (i != 1) {
                    model.push(layers)
                    layers = new Array<Shape>()
                }
                continue;
            }

            const line = lines[i];
            const tokens = line.split(' ');
            console.log(line)
            if (tokens[0] === 'rectangle' && tokens.length == 6) {
                const id = parseFloat(tokens[1])
                const x = parseFloat(tokens[2])
                const y = parseFloat(tokens[3])
                const w = parseFloat(tokens[4])
                const h = parseFloat(tokens[5])
                shape = new Rectangle(id, x, y, w, h)
            }
            else if (tokens[0] === 'circle' && tokens.length == 5) {
                const id = parseFloat(tokens[1])
                const x = parseFloat(tokens[2])
                const y = parseFloat(tokens[3])
                const r = parseFloat(tokens[4])
                shape = new Circle(id, x, y, r);
            }

            if (shape !== null)
                layers.push(shape);
            else {
                console.warn("Failed to read node: " + tokens[0]);
            }
        }
        model.push(layers)
        return model;
    }
}