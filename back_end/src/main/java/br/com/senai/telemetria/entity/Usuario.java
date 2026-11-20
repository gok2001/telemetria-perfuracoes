package br.com.senai.telemetria.entity;

import br.com.senai.telemetria.enums.Cargo;
import br.com.senai.telemetria.enums.StatusUsuario;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity 
@Table(name = "usuario") 
public class Usuario {
    
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY) 
    private Integer id;

    @Column(nullable = false, length = 150) 
    private String nome;

    @Column(unique = true, length = 11) 
    private String cpf;

    @Column(nullable = false, unique = true, length = 150) 
    private String email;

    @Column(nullable = false, length = 255) 
    private String senha;

    @Enumerated(EnumType.STRING) 
    @Column(nullable = false, length = 30) 
    private Cargo cargo;

    @Enumerated(EnumType.STRING) 
    @Column(nullable = false, length = 20) 
    private StatusUsuario status = StatusUsuario.ATIVO;

    public Usuario() {

    }

    public Integer getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getCpf() {
        return cpf;
    }

    public void setCpf(String cpf) {
        this.cpf = cpf;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
    }

    public Cargo getCargo() {
        return cargo;
    }

    public void setCargo(Cargo cargo) {
        this.cargo = cargo;
    }

    public StatusUsuario getStatus() {
        return status;
    }

    public void setStatus(StatusUsuario status) {
        this.status = status;
    }
}
