CREATE DATABASE funcionarios;
USE funcionarios;

CREATE TABLE funcionario
(
	cpf VARCHAR(11) PRIMARY KEY NOT NULL,
	matricula VARCHAR(7) NOT NULL,
    senha VARCHAR(50) NOT NULL,
    data_nascimento DATE NOT NULL,
    nome VARCHAR(144) NOT NULL,
    cpf_chefia VARCHAR(11),
    FOREIGN KEY (cpf_chefia) REFERENCES funcionario(cpf)
);

CREATE TABLE contato
(
	cpf VARCHAR(11),
    contato VARCHAR(512),
    FOREIGN KEY (cpf) REFERENCES funcionario(cpf)
);

INSERT INTO funcionario (cpf, matricula, senha, data_nascimento, nome)  VALUE
('18274659839', '1628476', '000','1993-06-17', 'Marcelo Szostack'),
('04582027123', '1617906', '515', '1997-05-17', 'Brendha Luiza');

INSERT INTO funcionario 
	(cpf, matricula, senha, data_nascimento, nome, cpf_chefia) 
VALUES
('08601235964', '1521987', '123', '1997-06-01', 'Gustavo Martins', '18274659839'),
('08601256392', '1821957', '456','1998-05-22', 'Luiz Eduardo', '08601235964'),
('12345335964', '1521123', '789','1999-03-03', 'Alexandre Borges', '08601256392'),
('98767876964', '1298987', '101','1996-08-09', 'Gabriel Guerra', '12345335964');

INSERT INTO contato VALUES
('18274659839','szostack@gmail.com'),
('08601235964','Gustavo@gmail.com'),
('08601256392','Luiz@gmail.com'),
('12345335964','Alexandre@gmail.com'),
('98767876964','Guerra@gmail.com'),
('04582027123','Brendha@gmail.com');

SELECT 
	f.cpf, f.nome, f.matricula, c.contato, f.data_nascimento, cf.nome AS nome_do_chefe 
	FROM funcionario f
LEFT JOIN contato c ON c.cpf = f.cpf
LEFT JOIN funcionario cf ON cf.cpf = f.cpf_chefia;