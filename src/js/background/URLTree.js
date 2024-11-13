class FileNode {
    constructor(name, source, id, description, risk) {
        this.name=name;
        this.source=source;
        this.id=id;
        this.description=description;
        this.risk=risk;
    }
  
    toJSON() {
        return {
            type: "file",
            name: this.name,
            source: this.source,
            id: this.id,
            description: this.description,
            risk: this.risk
        };
    }
}

class PathNode {
    static id = 0;
    constructor(url) {
        this.url = url;
        this.id = PathNode.id++;
        this.paths = [];
        this.files = [];
        this.parent = parent; 
    }

    addPath(url) {
        const pathNode = new PathNode(url, this);
        this.paths.push(pathNode);
        return pathNode;
    }
    
    addFile(name, source, id, description, risk) {
        const fileNode = new FileNode(name, source, id, description, risk);
        this.files.push(fileNode);
    }

    removePathById(id) {
        const index = this.paths.findIndex(path => path.id === id);
        if (index !== -1) {
            this.paths.splice(index, 1);
            return true;
        }

        for (let path of this.paths) {
            if (path.removePathById(id)) {
                return true;
            }
        }

        return false;
    }
    
    toJSON() {
        return {
            type: "path",
            url: this.url,
            id: this.id,
            files: this.files.map(file => file.toJSON()),
            paths: this.paths.map(path => path.toJSON())
        };
    }

}

export { FileNode, PathNode };