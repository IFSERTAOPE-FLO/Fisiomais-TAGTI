
def is_cpf_valid(cpf):
    cpf = cpf.replace('.', '').replace('-', '').strip()
    if len(cpf) != 11 or not cpf.isdigit() or cpf == cpf[0] * len(cpf):
        return False
    for i in range(9, 11):
        value = sum((int(cpf[num]) * ((i + 1) - num) for num in range(0, i)))
        digit = ((value * 10) % 11) % 10
        if digit != int(cpf[i]):
            return False
    return True

