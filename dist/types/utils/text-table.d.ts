export default function textTable(): {
    row: () => {
        cell: (fmt?: any, ...args: any[]) => any;
        row: any;
        label: (fmt: any, ...args: any[]) => any;
        tableWrite: () => any;
    };
    label: (fmt: any, ...args: any[]) => any;
    tableWrite: () => any;
};
