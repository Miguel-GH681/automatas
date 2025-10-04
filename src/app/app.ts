import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgxFileDropEntry, NgxFileDropModule } from 'ngx-file-drop';

@Component({
  selector: 'app-root',
  imports: [CommonModule, NgxFileDropModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  fileContent: string = '';
  tree : Array<any> = [{title: 'Aceptación', elemets: []}, {title: 'Alfabeto', elemets: []}, {title: 'Estados', elemets: []}];
  files: NgxFileDropEntry[] = [];
  elements: any[] = [];
  columns : any[] = [];
  rows : Array<Array<any>> = [[]];

  public onFileDropped(files: NgxFileDropEntry[]) {
    for (const droppedFile of files) {
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {

          if (!file.name.endsWith('.txt')) {
            alert('Solo se permiten archivos de texto plano.');
            return;
          }

          const reader = new FileReader();
          reader.onload = () => {
            this.fileContent = reader.result as string;
            this.getElemets()
          };
          reader.readAsText(file);          
        });
      }
    }
  }

  getElemets(){
    this.elements = this.fileContent.split("\n");
    let indices = [3,1,0];

    indices.forEach((t : number, i : number)=>{
      let match = this.elements[t].match(/\{([^}]*)\}/)
      this.tree[i]['elements'] = match[1].split(',');
    });
    
    this.getMatrix();
  }


  getMatrix(){    
    for(let i = 0; i < this.tree[1]['elements'].length + 1; i++){
      if(i == 0){
        this.columns[0] = '';
      } else{
        this.columns[i] = this.tree[1]['elements'][i-1]
      }
    }    

    let coordenadas : any= [];
    let match = this.elements[4].match(/\{([^}]*)\}/)
    if(match){
      coordenadas = match[1].split(',');      
    }
    
    this.tree[2]['elements'].forEach((sl:any, index : number)=>{
      let v = coordenadas.filter((coordenada:any)=> coordenada.includes('('+ sl + ';'));
      this.rows[index] = [sl, v[0].match(/\(([^}]*)\)/)[1].split(';')[1], v[1].match(/\(([^}]*)\)/)[1].split(';')[1]]
    });    
  }

  clean(){
    this.fileContent = ''
    this.elements = []
    this.tree = [{title: 'Aceptación', elemets: []}, {title: 'Alfabeto', elemets: []}, {title: 'Estados', elemets: []}];
    this.files = []
    this.columns = []
    this.rows = []
  }
}