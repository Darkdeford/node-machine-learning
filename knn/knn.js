// k-nearest-neighbour algorithm
// TODO make it more generic, so we can apply as many determinants as we wish(with different names)
const fs = require('fs');
const DATA_FILE_PATH = 'trainingData.json';
const k = 3; //NEAREST NEIGHBOUR SOLE PARAM, determines how many neighbours we will take into considaration during guess proccess

class Node {
    constructor(obj) {
        this.type = obj.type;
        this.area = obj.area;
        this.rooms = obj.rooms;
    };

    measureDistances(areaRangeObj, roomsRangeObj) {
        let roomsRange = roomsRangeObj.max - roomsRangeObj.min;
        let areaRange = areaRangeObj.max - areaRangeObj.min;

        this.neighbours.forEach(neighbour => {
            let deltaRooms = neighbour.rooms - this.rooms;
            deltaRooms = deltaRooms / roomsRange;

            let deltaArea = neighbour.area - this.area;
            deltaArea = deltaArea / areaRange;

            neighbour.distance = Math.sqrt(deltaRooms * deltaRooms + deltaArea * deltaArea);
        });
    }

    sortByDistance() {
        this.neighbours.sort((a, b) => a.distance - b.distance);
    }

    guessType(k) {
        let types = {};
        let neighbours = this.neighbours.slice(0, k);
        neighbours.forEach(neighbour => {
            types[neighbour.type] = types[neighbour.type] ? ++types[neighbour.type] : 1;
        });
        let guess = {type: false, count: 0};
        for (let type in types) {
            if (types[type] > guess.count) {
                guess.type = type;
                guess.count = types[type];
            }
        }

        this.guess = guess;

        return types;
    }
}

class NodeList {
    constructor(k) {
        this.nodes = [];
        this.k = k;
        this.loadData();
    };

    loadData() {
        let dataFile = fs.readFileSync(DATA_FILE_PATH, 'utf8');
        let nodesData = JSON.parse(dataFile).data;
        nodesData.forEach(node => this.nodes.push(new Node(node)));
    }

    calculateRanges() {
        this.areas = {min: 10000, max: 0};
        this.rooms = {min: 10000, max: 0};

        this.nodes.forEach(node => {
            this.rooms.min = node.rooms < this.rooms.min ? node.rooms : this.rooms.min;
            this.rooms.max = node.rooms > this.rooms.max ? node.rooms : this.rooms.max;

            this.areas.min = node.areas < this.areas.min ? node.areas : this.areas.min;
            this.areas.max = node.areas > this.areas.max ? node.areas : this.areas.max;
        });
    }

    determineUnknown() {
        this.calculateRanges();

        this.nodes.forEach((node) => {
            if (!node.type) {
                node.neighbours = [];

                this.nodes.forEach((nodeNeighbour) => {
                    if (nodeNeighbour.type) {
                        node.neighbours.push(new Node(nodeNeighbour));
                        node.measureDistances(this.areas, this.rooms);
                        node.sortByDistance();
                    }
                });

                node.guessType(this.k);
                console.log(node.guess);
            }
        });
    }
}

let knn = new NodeList(3);
knn.determineUnknown();