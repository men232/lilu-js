export default function createTBag(): {
    w(...args: any[]): any;
    table: typeof textTable;
    a(...args: any[]): any;
    attach(instance: any, prepend?: boolean): any;
    merge(instance: any): any;
    child(instance: any, prepend?: boolean): any;
    childs: any[];
    lines: any[];
    collect: () => any;
    str: () => any;
};
import textTable from "./text-table";
