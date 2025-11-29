FROM golang:1.25.4-trixie AS builder
WORKDIR /backend
ENV GOEXPERIMENT=greenteagc
COPY . .
RUN go mod tidy

RUN go build -o backend .

FROM debian:bookworm-slim
WORKDIR /backend
RUN apt-get update && apt-get install -y ca-certificates curl && rm -rf /var/lib/apt/lists/*
COPY --from=builder /backend/backend .
EXPOSE 8080
ENTRYPOINT ["./backend"]