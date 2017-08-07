// k-nearest-neighbour algorithm
// TODO make it more generic, so we can apply as many determinants as we wish(with different names)
//const fs = require('fs');

const DATA = [
    {"rooms": 1, "area": 350, "type": "apartment"},
    {"rooms": 2, "area": 300, "type": "apartment"},
    {"rooms": 3, "area": 300, "type": "apartment"},
    {"rooms": 4, "area": 250, "type": "apartment"},
    {"rooms": 4, "area": 500, "type": "apartment"},
    {"rooms": 4, "area": 400, "type": "apartment"},
    {"rooms": 5, "area": 450, "type": "apartment"},

    {"rooms": 7,  "area": 850,  "type": "house"},
    {"rooms": 7,  "area": 900,  "type": "house"},
    {"rooms": 7,  "area": 1200, "type": "house"},
    {"rooms": 8,  "area": 1500, "type": "house"},
    {"rooms": 9,  "area": 1300, "type": "house"},
    {"rooms": 8,  "area": 1240, "type": "house"},
    {"rooms": 10, "area": 1700, "type": "house"},
    {"rooms": 9,  "area": 1000, "type": "house"},

    {"rooms": 1, "area": 800,  "type": "flat"},
    {"rooms": 3, "area": 900,  "type": "flat"},
    {"rooms": 2, "area": 700,  "type": "flat"},
    {"rooms": 1, "area": 900,  "type": "flat"},
    {"rooms": 2, "area": 1150, "type": "flat"},
    {"rooms": 1, "area": 1000, "type": "flat"},
    {"rooms": 2, "area": 1200, "type": "flat"},
    {"rooms": 1, "area": 1300, "type": "flat"},
];

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

    add(node) {
        this.nodes.push(node);
    }

    loadData() {
        //let dataFile = fs.readFileSync(DATA_FILE_PATH, 'utf8');
        //let nodesData = JSON.parse(dataFile).data;
        let nodesData = DATA;
        nodesData.forEach(node => this.nodes.push(new Node(node)));
    }

    calculateRanges() {
        this.areas = {min: 10000, max: 0};
        this.rooms = {min: 10000, max: 0};

        this.nodes.forEach(node => {
            this.rooms.min = node.rooms < this.rooms.min ? node.rooms : this.rooms.min;
            this.rooms.max = node.rooms > this.rooms.max ? node.rooms : this.rooms.max;

            this.areas.min = node.area < this.areas.min ? node.area : this.areas.min;
            this.areas.max = node.area > this.areas.max ? node.area : this.areas.max;
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

    draw(canvasId) {
        //apartments - red, houses - green, flats - blue, unknown - grey

        let roomsRange = this.rooms.max - this.rooms.min;
        let areasRange = this.areas.max - this.areas.min;

        let ctx = canvas.getContext('2d');
        let width = 400;
        let height = 400;
        ctx.clearRect(0, 0, width, height);

        let padding = 40;
        let xShift = (width - padding) / width;
        let yShift = (height - padding) / height;

        this.nodes.forEach(node => {
           ctx.save();

            switch(node.type) {
                case 'apartment':
                    ctx.fillStyle = 'red';
                    break;
                case 'house':
                    ctx.fillStyle = 'green';
                    break;
                case 'flat':
                    ctx.fillStyle = 'blue';
                    break;
                default:
                    ctx.fillStyle = '#666666';
            }

            let x = (node.rooms - this.rooms.min) * (width / roomsRange) * xShift + (padding / 2);
            let y = (node.area - this.areas.min) * (height / areasRange) * yShift + (padding / 2);
            y = Math.abs(y - height); // because origin is in the top-left corner, not bottom-left :)

            ctx.translate(x, y);
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2, true);
            ctx.fill();
            ctx.closePath();

            if (!node.type) {
                switch(node.guess.type) {
                    case 'apartment':
                        ctx.strokeStyle = 'red';
                        break;
                    case 'house':
                        ctx.strokeStyle = 'green';
                        break;
                    case 'flat':
                        ctx.strokeStyle = 'blue';
                        break;
                    default:
                        ctx.strokeStyle = '#666666';
                }

                let radius = node.neighbours[this.k - 1].distance * width;
                radius *= xShift;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2, true);
                ctx.stroke();
                ctx.closePath();
            }

            ctx.restore();
        });
    }
}

function run() {
    let nodes = new NodeList(3);
    nodes.add(getRandomUnknownNode());
    nodes.determineUnknown();
    nodes.draw('canvas');
}

function getRandomUnknownNode() {
    let randomRooms = Math.round(Math.random() * 10);
    let randomArea = Math.round(Math.random() * 2000);

    return new Node({rooms: randomRooms, area: randomArea});
}

window.onload = () => {
    generate_new_unknown.addEventListener('click', () => {
        console.log('siema');
        run();
    })
}

