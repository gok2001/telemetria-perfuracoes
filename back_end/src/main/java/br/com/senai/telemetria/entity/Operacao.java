package br.com.senai.telemetria.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

import br.com.senai.telemetria.enums.StatusOperacao;

@Entity 
@Table(name = "operacao") 
public class Operacao {
    
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY) 
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY) 
    @JoinColumn(name = "usuario_id", nullable = false) 
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY) 
    @JoinColumn(name = "sonda_id", nullable = false) 
    private Sonda sonda;

    @Column(name = "data_hora_inicio", nullable = false) 
    private Instant dataHoraInicio;

    @Column(name = "data_hora_fim") 
    private Instant dataHoraFim;

    @Enumerated(EnumType.STRING) 
    @Column(nullable = false, length = 20) 
    private StatusOperacao status;

    @Column(name = "caminho_arquivo", length = 500) 
    private String caminhoArquivo;

    public Operacao() {

    }

    public Integer getId() {
        return id;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Sonda getSonda() {
        return sonda;
    }

    public void setSonda(Sonda sonda) {
        this.sonda = sonda;
    }

    public Instant getDataHoraInicio() {
        return dataHoraInicio;
    }

    public void setDataHoraInicio(Instant dataHoraInicio) {
        this.dataHoraInicio = dataHoraInicio;
    }

    public Instant getDataHoraFim() {
        return dataHoraFim;
    }

    public void setDataHoraFim(Instant dataHoraFim) {
        this.dataHoraFim = dataHoraFim;
    }

    public StatusOperacao getStatus() {
        return status;
    }

    public void setStatus(StatusOperacao status) {
        this.status = status;
    }

    public String getCaminhoArquivo() {
        return caminhoArquivo;
    }

    public void setCaminhoArquivo(String caminhoArquivo) {
        this.caminhoArquivo = caminhoArquivo;
    }
}
