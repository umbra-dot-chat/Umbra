FROM coturn/coturn:latest

COPY turnserver.conf /etc/coturn/turnserver.conf

EXPOSE 3478/udp
EXPOSE 3478/tcp
EXPOSE 5349/tcp
EXPOSE 49152-65535/udp

# Shell form so ${TURN_SECRET} is expanded at runtime
ENTRYPOINT ["/bin/sh", "-c", "exec turnserver -c /etc/coturn/turnserver.conf --static-auth-secret=${TURN_SECRET}"]
