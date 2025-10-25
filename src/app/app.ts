import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgxFileDropEntry, NgxFileDropModule } from 'ngx-file-drop';

interface Transition {
  from: string;
  to: string;
  symbol: string;
}

interface TableRow {
  name: string;
  transitions: { [key: string]: string };
  composition: string[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, NgxFileDropModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  fileContent = '';
  states: string[] = [];
  alphabet: string[] = [];
  initialState = '';
  finalStates: string[] = [];
  transitions: Transition[] = [];
  transitionTable: { [state: string]: { [symbol: string]: string[] } } = {};
  symbols: string[] = [];
  table: TableRow[] = [];
  afdText : string = '';

  onFileDropped(files: NgxFileDropEntry[]) {
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
            this.parseFile(this.fileContent);
            this.generateTransitionTable();
            this.generateTransD();
            this.generateAfdTxt();
          };
          reader.readAsText(file);
        });
      }
    }
  }

  private parseFile(text: string) {
    const lines = text.split(/\r?\n/);

    lines.forEach(line =>{
      switch(line.substring(0,2)){
        case 'Q:':
          this.states = line.match(/\{([^}]*)\}/)?.[1].split(',') || [];
        break;
        case 'L:':
          this.alphabet = line.match(/\{([^}]*)\}/)?.[1].split(',') || [];
        break;
        case 'i:':
          this.initialState = line.split(':')[1];
        break;
        case 'A:':
          this.finalStates = line.match(/\{([^}]*)\}/)?.[1].split(',') || [];
        break;
        case 'W:':
          const rawTransitions = line.match(/\{([^}]*)\}/)?.[1];
          if (rawTransitions) {
            const parts = rawTransitions.split('),').map(p => p.replace(/[(){}]/g, ''));
            this.transitions = parts.map(p => {
              const [from, to, symbol] = p.split(';');
              return { from, to, symbol };
            });
          }
        break;
      }
    });
  }

  private epsilonClosure(stateSet: string[]): string[] {
    const closure = new Set(stateSet);
    const stack = [...stateSet];

    while (stack.length > 0) {
      const state = stack.pop()!;
      for (const t of this.transitions) {
        if (t.from === state && t.symbol === 'e' && !closure.has(t.to)) {
          closure.add(t.to);
          stack.push(t.to);
        }
      }
    }

    return Array.from(closure).sort((a, b) => Number(a) - Number(b));
  }

  private move(stateSet: string[], symbol: string): string[] {
    const result = new Set<string>();

    for (const state of stateSet) {
      for (const t of this.transitions) {
        if (t.from === state && t.symbol === symbol) {
          result.add(t.to);
        }
      }
    }

    return Array.from(result);
  }

  private generateTransitionTable() {
    const allSymbols = new Set(this.alphabet);
    if (this.transitions.some(t => t.symbol === 'e')) {
      allSymbols.add('ε');
    }
    this.symbols = Array.from(allSymbols);

    this.transitionTable = {};
    for (const state of this.states) {
      this.transitionTable[state] = {};
      for (const s of this.symbols) {
        this.transitionTable[state][s] = [];
      }
    }

    for (const t of this.transitions) {
      const symbol = t.symbol === 'e' ? 'ε' : t.symbol;
      if (!this.transitionTable[t.from][symbol].includes(t.to)) {
        this.transitionTable[t.from][symbol].push(t.to);
      }
    }
  }

  private generateTransD() {
    this.table = [];
    const usedNames = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    let nameIndex = 0;

    const stateNames: { [key: string]: string } = {};
    const processed: string[][] = [];
    const unprocessed: string[][] = [];

    const start = this.epsilonClosure([this.initialState]);
    const startKey = start.join(',');
    stateNames[startKey] = usedNames[nameIndex++];
    unprocessed.push(start);

    while (unprocessed.length > 0) {
      const current = unprocessed.shift()!;
      const currentKey = current.join(',');
      const currentName = stateNames[currentKey];

      const row: TableRow = {
        name: currentName,
        transitions: {},
        composition: current
      };

      for (const symbol of this.alphabet) {
        const moveSet = this.move(current, symbol);
        const closure = this.epsilonClosure(moveSet);

        if (closure.length === 0) {
          row.transitions[symbol] = '-';
          continue;
        }

        const key = closure.join(',');
        if (!stateNames[key]) {
          stateNames[key] = usedNames[nameIndex++];
          unprocessed.push(closure);
        }

        row.transitions[symbol] = stateNames[key];
      }

      processed.push(current);
      this.table.push(row);
    }
  }

  generateAfdTxt(): void {
    const Q = this.table.map(row => row.name).join(',');
    const L = this.alphabet.join(',');
    const i = this.table.length > 0 ? this.table[0].name : '';
    const A = this.table
      .filter(row => row.composition.some(c => this.finalStates.includes(c)))
      .map(row => row.name)
      .join(',');

    const transitions: string[] = [];
    for (const row of this.table) {
      for (const symbol of this.alphabet) {
        const dest = row.transitions[symbol];
        if (dest && dest !== '-') {
          transitions.push(`(${row.name};${dest};${symbol})`);
        }
      }
    }
    const W = transitions.join(',');

    this.afdText = `Q:{${Q}}
    L:{${L}}
    i:${i}
    A:{${A}}
    W:{${W}}`;

    this.afdText = 'Q:{' + Q + '} \n' +
    'L:{' + L + '} \n' +
    'i:' + i + ' \n' +
    'A:{' + A + '} \n' +
    'W:{' + W + '}'
  }
}