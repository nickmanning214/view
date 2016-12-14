function Team(city,mascot){
    this.city = city;
    this.mascot = mascot;
}

var teams = [
    new Team("Baltimore","Ravens"),
    new Team("Pittsburgh","Steelers"),
    new Team("Cincinnati","Bengals"),
    new Team("Cleveland","Browns")
]

function Division(name){
    this.name = name;
    this.teams = teams;
}

var division = new Division("AFC North",teams);