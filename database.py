import sqlite3
import click
import os # Necessário para verificar existência do arquivo
from flask import current_app, g
from flask.cli import with_appcontext

DATABASE = 'gerenciador_projetos.db' # Nome do arquivo do banco de dados

def get_db():
    """Conecta ao banco de dados da aplicação, criando-o se não existir."""
    if 'db' not in g:
        g.db = sqlite3.connect(
            DATABASE,
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row # Retorna linhas como dicionários
    return g.db

def close_db(e=None):
    """Fecha a conexão com o banco de dados."""
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    """Limpa os dados existentes (se houver) e cria novas tabelas a partir do schema.sql."""
    db = get_db()
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql') # Garante caminho correto

    try:
        # CORREÇÃO: Especifica a codificação UTF-8 ao ler o arquivo SQL
        with open(schema_path, 'r', encoding='utf-8') as f:
            db.executescript(f.read())
    except FileNotFoundError:
        click.echo(f"Erro: Arquivo '{schema_path}' não encontrado.", err=True)
    except Exception as e:
        # Captura outros erros potenciais durante a execução do script
        click.echo(f"Erro ao executar o script SQL '{schema_path}': {e}", err=True)


@click.command('init-db')
@with_appcontext
def init_db_command():
    """Comando de linha de comando: flask init-db"""
    try:
        init_db()
        click.echo('Banco de dados inicializado com sucesso.')
    except Exception as e:
        # Captura erros que podem ocorrer em get_db ou init_db
        click.echo(f"Falha ao inicializar o banco de dados: {e}", err=True)


def init_app(app):
    """Registra funções relacionadas ao banco de dados com a aplicação Flask."""
    app.teardown_appcontext(close_db) # Garante que close_db seja chamado
    app.cli.add_command(init_db_command) # Adiciona o comando 'flask init-db'

# --- Funções específicas da aplicação ---

def query_db(query, args=(), one=False):
    """Executa uma query SELECT e retorna os resultados."""
    try:
        cur = get_db().execute(query, args)
        rv = cur.fetchall()
        cur.close()
        return (rv[0] if rv else None) if one else rv
    except sqlite3.Error as e:
        current_app.logger.error(f"Erro na query do banco de dados: {e}\nQuery: {query}\nArgs: {args}")
        # Em um app real, você pode querer lançar a exceção ou retornar um valor padrão
        raise # Re-lança a exceção para ser tratada no chamador (e.g., app.py)

def execute_db(query, args=()):
    """Executa um comando INSERT, UPDATE ou DELETE e faz commit."""
    try:
        db = get_db()
        cur = db.execute(query, args)
        db.commit()
        last_id = cur.lastrowid
        cur.close()
        return last_id
    except sqlite3.Error as e:
        current_app.logger.error(f"Erro na execução do banco de dados: {e}\nQuery: {query}\nArgs: {args}")
        # Importante reverter a transação em caso de erro se outras operações dependerem dela
        db.rollback()
        raise # Re-lança a exceção