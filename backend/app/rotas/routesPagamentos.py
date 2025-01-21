from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from sqlalchemy.exc import SQLAlchemyError
from app.models import Agendamentos, Pagamentos, Faturas, Clientes, Servicos, Colaboradores, Clinicas
from app import db

# Novo Blueprint para lidar com a criação de pagamentos e faturas
pagamentos_faturas = Blueprint('pagamentos_faturas', __name__)

@pagamentos_faturas.route('/gerar_pagamento_fatura/<int:agendamento_id>', methods=['POST'])
def gerar_pagamento_fatura(agendamento_id):
    try:
        # Buscar o agendamento
        agendamento = Agendamentos.query.get(agendamento_id)
        if not agendamento:
            return jsonify({'message': 'Agendamento não encontrado'}), 404

        # Verificar se o agendamento já foi pago ou gerado
        if agendamento.status == 'pago':
            return jsonify({'message': 'O agendamento já foi pago'}), 400
        
        # Verificar o valor do serviço (pode ser modificado conforme a lógica do seu sistema)
        servico = Servicos.query.get(agendamento.id_servico)
        if not servico:
            return jsonify({'message': 'Serviço não encontrado'}), 404
        
        valor_servico = servico.valor  # Valor do serviço, ajustável conforme a lógica de negócios

        # Criar o pagamento
        novo_pagamento = Pagamentos(
            id_agendamento=agendamento.id_agendamento,
            valor=valor_servico,
            metodo_pagamento='a definir',  # Método de pagamento, pode ser ajustado conforme necessário
            status='pendente',  # O pagamento começa como pendente
            data_pagamento=None,  # A data de pagamento só será preenchida quando o pagamento for realizado
            referencia_pagamento=None  # Pode ser uma referência externa, se necessário
        )
        db.session.add(novo_pagamento)
        db.session.commit()  # Salva o pagamento e gera o ID para a fatura

        # Criar a fatura
        vencimento = datetime.utcnow() + timedelta(days=30)  # Exemplo: vencimento 30 dias após a emissão
        nova_fatura = Faturas(
            id_cliente=agendamento.id_cliente,
            id_pagamento=novo_pagamento.id_pagamento,
            vencimento=vencimento,
            valor_total=valor_servico,
            status='pendente'  # Fatura começa como pendente
        )
        db.session.add(nova_fatura)
        db.session.commit()  # Commit para salvar a fatura

        # Atualizar o status do agendamento
        agendamento.status = 'pendente_pagamento'  # Status atualizado para indicar que o pagamento está pendente
        db.session.commit()

        return jsonify({'message': 'Pagamento e fatura gerados com sucesso'}), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao gerar pagamento e fatura: {str(e)}'}), 500

