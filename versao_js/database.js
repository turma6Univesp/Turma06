const database = {
    projetos: JSON.parse(localStorage.getItem("projetos")) || [],
    pessoas: JSON.parse(localStorage.getItem("pessoas")) || [],
    viagens: JSON.parse(localStorage.getItem("viagens")) || [],
    
    salvar: function() {
        localStorage.setItem("projetos", JSON.stringify(this.projetos));
        localStorage.setItem("pessoas", JSON.stringify(this.pessoas));
        localStorage.setItem("viagens", JSON.stringify(this.viagens));
    }
};
