# csv
cp ./receiver.js /var/www/csv

add execute permission to receiver.js
 sudo chmod +x receiver.js

 
Copy your service file into the /etc/systemd/system.

Start it with systemctl start myapp.

