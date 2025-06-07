FROM public.ecr.aws/lambda/nodejs:18

# Install Chrome dependencies
RUN yum install -y \
    atk \
    cups-libs \
    gtk3 \
    libXcomposite \
    libXcursor \
    libXdamage \
    libXext \
    libXi \
    libXrandr \
    libXScrnSaver \
    libXtst \
    pango \
    xorg-x11-fonts-100dpi \
    xorg-x11-fonts-75dpi \
    xorg-x11-fonts-cyrillic \
    xorg-x11-fonts-Type1 \
    xorg-x11-fonts-misc \
    xorg-x11-utils \
    alsa-lib

# Copy package.json and install dependencies
COPY package*.json ${LAMBDA_TASK_ROOT}/
RUN npm install

# Copy function code
COPY index.js ${LAMBDA_TASK_ROOT}/

# Set the CMD to your handler
CMD [ "index.handler" ] 