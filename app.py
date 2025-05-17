import os
import sqlite3 # Importar para capturar IntegrityError especificamente
from flask import (
    Flask, render_template, request, redirect,
    url_for, jsonify, flash, current_app
)
import database as db # Importa nosso módulo database

app = Flask(__name__)
# Necessário para usar flash messages e sessões (se usar)
app.config['SECRET_KEY'] = os.urandom(24) # Chave secreta segura

# Inicializa o banco de dados com a aplicação (registra comandos e teardown)
db.init_app(app)

@app.errorhandler(Exception) # Handler genérico para erros inesperados
def handle_exception(e):
    # Log do erro
    current_app.logger.error(f"Erro não tratado: {e}", exc_info=True)
    # Pode redirecionar para uma página de erro genérica ou mostrar uma mensagem
    flash("Ocorreu um erro inesperado no servidor.", "error")
    # Tentar renderizar a página principal pode falhar se o erro for grave
    # return render_template('error.html', error=str(e)), 500 # Idealmente teria uma página de erro
    return redirect(url_for('index')) # Redireciona para index como fallback

@app.route('/')
def index():
    """Página principal, exibe formulários e opções."""
    projetos = [] # Inicializa como lista vazia
    try:
        # Busca projetos para popular os selects
        projetos = db.query_db('SELECT id, nome FROM projetos ORDER BY nome')
    except sqlite3.Error as e:
        current_app.logger.error(f"Erro ao carregar projetos na página inicial: {e}")
        flash("Erro ao carregar a lista de projetos. Verifique a conexão com o banco de dados.", "error")
    except Exception as e: # Captura outros erros inesperados
        current_app.logger.error(f"Erro inesperado ao carregar a página inicial: {e}")
        flash("Ocorreu um erro ao carregar a página.", "error")

    return render_template('index.html', projetos=projetos)

@app.route('/add_project', methods=['POST'])
def add_project():
    """Adiciona um novo projeto."""
    nome = request.form.get('nome_projeto')
    data_inicio = request.form.get('data_inicio') or None # Trata string vazia como None
    data_fim = request.form.get('data_fim') or None       # Trata string vazia como None

    if not nome:
        flash("Nome do projeto é obrigatório.", "error")
        return redirect(url_for('index'))

    try:
        db.execute_db(
            'INSERT INTO projetos (nome, data_inicio, data_fim) VALUES (?, ?, ?)',
            (nome, data_inicio, data_fim)
        )
        flash(f"Projeto '{nome}' cadastrado com sucesso!", "success")
    except sqlite3.IntegrityError:
        # Erro específico se o nome do projeto já existir (devido ao UNIQUE)
        flash(f"Erro: Já existe um projeto com o nome '{nome}'.", "error")
    except sqlite3.Error as e:
        current_app.logger.error(f"Erro de banco de dados ao adicionar projeto: {e}")
        flash("Erro ao cadastrar projeto no banco de dados.", "error")
    except Exception as e:
        current_app.logger.error(f"Erro inesperado ao adicionar projeto: {e}")
        flash("Ocorreu um erro inesperado ao cadastrar o projeto.", "error")

    return redirect(url_for('index', _anchor='cadastro-projeto')) # Redireciona para a âncora

@app.route('/add_cast', methods=['POST'])
def add_cast():
    """Adiciona um membro do elenco a um projeto."""
    projeto_id = request.form.get('projeto_id_elenco')
    nome_elenco = request.form.get('nome_elenco')

    if not projeto_id or not nome_elenco:
        flash("Selecione o projeto e informe o nome do ator/diretor.", "error")
        return redirect(url_for('index', _anchor='cadastro-elenco'))

    try:
        # Verifica se o projeto existe antes de tentar buscar o nome
        projeto = db.query_db('SELECT nome FROM projetos WHERE id = ?', [projeto_id], one=True)
        if not projeto:
             flash(f"Erro: Projeto com ID {projeto_id} não encontrado.", "error")
             return redirect(url_for('index', _anchor='cadastro-elenco'))

        db.execute_db(
            'INSERT INTO elenco (nome, projeto_id) VALUES (?, ?)',
            (nome_elenco, projeto_id)
        )
        flash(f"Membro '{nome_elenco}' adicionado ao projeto '{projeto['nome']}' com sucesso!", "success")
    except sqlite3.Error as e:
        current_app.logger.error(f"Erro de banco de dados ao adicionar elenco: {e}")
        flash("Erro ao adicionar membro do elenco no banco de dados.", "error")
    except Exception as e:
        current_app.logger.error(f"Erro inesperado ao adicionar elenco: {e}")
        flash("Ocorreu um erro inesperado ao adicionar o membro do elenco.", "error")

    return redirect(url_for('index', _anchor='cadastro-elenco'))

@app.route('/add_flight', methods=['POST'])
def add_flight():
    """Adiciona dados de voo para um membro do elenco."""
    elenco_id = request.form.get('elenco_id_voo')
    preco_str = request.form.get('preco_passagem')
    dados_voo = request.form.get('dados_voo') or None
    trecho = request.form.get('trecho') or None
    data_voo = request.form.get('data_voo') or None
    horario = request.form.get('horario') or None
    data_emissao = request.form.get('data_emissao') or None
    solicitacao = request.form.get('solicitacao') or None
    complemento = request.form.get('complemento') or None

    if not elenco_id:
        flash("Selecione o projeto e o membro do elenco.", "error")
        return redirect(url_for('index', _anchor='cadastro-voo'))

    # Validação e conversão do preço
    preco_passagem = None
    if preco_str:
        try:
            # Substitui vírgula por ponto para conversão segura
            preco_passagem = float(preco_str.replace(',', '.'))
        except ValueError:
            flash("Preço da passagem inválido. Use números e, opcionalmente, ponto ou vírgula decimal.", "error")
            return redirect(url_for('index', _anchor='cadastro-voo'))

    try:
        # Verifica se o membro do elenco existe
        elenco = db.query_db('SELECT nome FROM elenco WHERE id = ?', [elenco_id], one=True)
        if not elenco:
            flash(f"Erro: Membro do elenco com ID {elenco_id} não encontrado.", "error")
            return redirect(url_for('index', _anchor='cadastro-voo'))

        db.execute_db(
            '''INSERT INTO voos
               (elenco_id, preco_passagem, dados_voo, trecho, data_voo, horario, data_emissao, solicitacao, complemento)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (elenco_id, preco_passagem, dados_voo, trecho, data_voo, horario, data_emissao, solicitacao, complemento)
        )
        flash(f"Dados de voo cadastrados para '{elenco['nome']}' com sucesso!", "success")
    except sqlite3.Error as e:
        current_app.logger.error(f"Erro de banco de dados ao adicionar voo: {e}")
        flash("Erro ao cadastrar dados de voo no banco de dados.", "error")
    except Exception as e:
        current_app.logger.error(f"Erro inesperado ao adicionar voo: {e}")
        flash("Ocorreu um erro inesperado ao cadastrar os dados de voo.", "error")

    return redirect(url_for('index', _anchor='cadastro-voo'))

# --- Rotas para AJAX (carregamento dinâmico de dados) ---

@app.route('/get_cast_for_project/<int:project_id>')
def get_cast_for_project(project_id):
    """Retorna membros do elenco para um projeto específico (JSON)."""
    try:
        elenco = db.query_db(
            'SELECT id, nome FROM elenco WHERE projeto_id = ? ORDER BY nome',
            [project_id]
        )
        # Converte resultado (lista de Rows) para lista de dicionários compatível com JSON
        elenco_list = [dict(row) for row in elenco]
        return jsonify(elenco_list)
    except sqlite3.Error as e:
        current_app.logger.error(f"Erro DB ao buscar elenco para projeto {project_id}: {e}")
        return jsonify({"error": "Erro ao consultar o banco de dados."}), 500
    except Exception as e:
        current_app.logger.error(f"Erro inesperado ao buscar elenco para projeto {project_id}: {e}")
        return jsonify({"error": "Erro interno no servidor."}), 500

@app.route('/get_flights_for_cast/<int:cast_id>')
def get_flights_for_cast(cast_id):
    """Retorna voos para um membro específico do elenco (JSON)."""
    try:
        voos = db.query_db(
            '''SELECT id, preco_passagem, dados_voo, trecho, data_voo, horario, data_emissao, solicitacao, complemento
               FROM voos
               WHERE elenco_id = ?
               ORDER BY data_voo DESC, horario DESC''', # Ordena por mais recente primeiro
            [cast_id]
        )
        # Converte resultado para lista de dicionários compatível com JSON
        voos_list = [dict(row) for row in voos]
        return jsonify(voos_list)
    except sqlite3.Error as e:
        current_app.logger.error(f"Erro DB ao buscar voos para elenco {cast_id}: {e}")
        return jsonify({"error": "Erro ao consultar o banco de dados."}), 500
    except Exception as e:
        current_app.logger.error(f"Erro inesperado ao buscar voos para elenco {cast_id}: {e}")
        return jsonify({"error": "Erro interno no servidor."}), 500


# Verifica se o script está sendo executado diretamente
if __name__ == '__main__':
    # Verifica se o BD existe, se não, avisa para usar o comando init-db
    if not os.path.exists(db.DATABASE):
         print(f"AVISO: Banco de dados '{db.DATABASE}' não encontrado.")
         print("Execute 'flask init-db' no terminal para criar e inicializar o banco de dados antes de rodar a aplicação.")
         # Poderia tentar criar aqui, mas é mais explícito pedir ao usuário
         # with app.app_context():
         #     try:
         #         db.init_db()
         #         print(f"Banco de dados '{db.DATABASE}' criado e inicializado.")
         #     except Exception as e:
         #         print(f"Falha ao tentar inicializar o banco de dados automaticamente: {e}")
    # Roda a aplicação em modo debug (útil para desenvolvimento)
    app.run(debug=True, host='0.0.0.0', port=5000) # Escuta em todas as interfaces