import * as path from "path";
import * as fs from "fs";
const deploy = path.resolve(__dirname, "../");

let args = process.argv;

let componentName = args[2];
let styleType = args[3];
let needHtml = args[4];

function ucfirst(str: string): string {
    let first = str[0];
    let regExp = new RegExp("^" + first);
    return str.replace(regExp, first.toUpperCase());
}

function transformToCamelCase(name: string): string {
    let arr = name.split("-");
    let newArr: string[] = [];

    arr.forEach(item => {
        newArr.push(ucfirst(item));
    });

    return newArr.join("");
}

export namespace Adder {
    export interface FileWriteInfo{
        filename: string;
        data: string;
    }
    export type StyleSourceType = "less" | "scss";
    export type SourceType = StyleSourceType | "ts" | "html";
}

export class Adder {
    public deploy: string = path.resolve(__dirname, "../");
    readonly componentName: string;
    readonly upperName: string;
    readonly styleType: Adder.StyleSourceType;
    readonly needHtml: boolean = true;

    constructor(args: string[]) {
        this.componentName = args[2];
        this.styleType = <Adder.StyleSourceType>args[3];
        if (args[4] && (args[4] != "true")) {
            this.needHtml = false;
        }
        this.upperName = transformToCamelCase(args[2]);
    }

    public addComponent() {
        this.addFloder();
        this.addTsFile();
        if (this.styleType) {
            this.addStyleFile();
        }
        if (this.needHtml) {
            this.addTplFile();
        }
    }

    public addFloder() {
        let floder = path.join(this.deploy, this.componentName);
        if (!fs.existsSync(floder)) {
            fs.mkdirSync(floder);
        }
    }

    public getTsData(): string {
        let {upperName} = this;
        let hasStyle = !!this.styleType;
        let loadStyle = '';
        let loadHtml = '';
        if (hasStyle) {
            loadStyle = `import "./${upperName}.${this.styleType}";`;
        }

        if (this.needHtml) {
            loadHtml = `template: require("./${upperName}.html")`;
        }

        return `
//${upperName}

${loadStyle}

import Vue from "vue";
import Component from "vue-class-component";

export namespace ${upperName} {

}

export interface ${upperName} {

}

@Component({
    ${loadHtml}
})
export class ${upperName} extends Vue {

}
        `;
    }

    public writeFile(filename: string, data: string): Promise<Adder.FileWriteInfo> {
        return new Promise<Adder.FileWriteInfo>((resolve, reject) => {
            fs.writeFile(filename, data, 'utf8', (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        filename,
                        data: data
                    });
                }
            });
        });
    }

    public getFilename(type: Adder.SourceType): string{
        return path.join(this.deploy, this.componentName, this.upperName + "." + type);
    }

    public async addTsFile(): Promise<Adder.FileWriteInfo> {
        let filename = this.getFilename("ts");
        let tsData = this.getTsData();
        return this.writeFile(filename, tsData);        
    }

    public getStyleData(): string {
        return `
.${this.componentName} {

}
        `;
    }

    public async addStyleFile(): Promise<Adder.FileWriteInfo> {
        let filename = this.getFilename(this.styleType);
        let styleData = this.getStyleData();
        return this.writeFile(filename, styleData);   
    }

    public getTplData(): string {
        return `
<div class="${this.componentName}">

</div>        
        `;
    }

    public async addTplFile(): Promise<Adder.FileWriteInfo> {
        let filename = this.getFilename("html");
        let data = this.getTplData();
        return this.writeFile(filename, data);   
    }
}

let adder = new Adder(args);

adder.addComponent();