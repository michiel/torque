#!/usr/bin/env python3
"""
Simple diagnostic script to help debug Tauri desktop connection issues
"""
import requests
import socket
import json
import time
import os
import sys
from pathlib import Path

def check_port_open(host, port, timeout=5):
    """Check if a port is open"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except:
        return False

def check_http_endpoint(url, timeout=5):
    """Check if an HTTP endpoint is reachable"""
    try:
        response = requests.get(url, timeout=timeout)
        return response.status_code, response.text[:200]
    except requests.exceptions.RequestException as e:
        return None, str(e)

def find_torque_data_dir():
    """Find the Torque data directory"""
    possible_dirs = []
    
    # Check common locations
    if os.name == 'nt':  # Windows
        appdata = os.environ.get('APPDATA')
        if appdata:
            possible_dirs.append(Path(appdata) / "com.torque.desktop")
    else:  # Unix-like
        home = Path.home()
        possible_dirs.extend([
            home / ".local" / "share" / "com.torque.desktop",
            home / "Library" / "Application Support" / "com.torque.desktop",  # macOS
            home / ".config" / "torque-desktop",
        ])
    
    for dir_path in possible_dirs:
        if dir_path.exists():
            return dir_path
    
    return None

def check_server_port_file():
    """Check if server port file exists and read it"""
    data_dir = find_torque_data_dir()
    if not data_dir:
        print("❌ Could not find Torque data directory")
        return None
    
    port_file = data_dir / "server_port.txt"
    if not port_file.exists():
        print(f"❌ Port file not found: {port_file}")
        return None
    
    try:
        with open(port_file, 'r') as f:
            port = int(f.read().strip())
        print(f"✅ Found port file: {port_file}")
        print(f"📋 Embedded server port: {port}")
        return port
    except Exception as e:
        print(f"❌ Error reading port file: {e}")
        return None

def main():
    print("🔍 Torque Desktop Connection Diagnostic Tool")
    print("=" * 50)
    
    # Check if server port file exists
    print("\n1. Checking for embedded server...")
    server_port = check_server_port_file()
    
    if server_port:
        print(f"\n2. Testing embedded server on port {server_port}...")
        
        # Check if port is open
        if check_port_open('127.0.0.1', server_port):
            print(f"✅ Port {server_port} is open")
            
            # Test health endpoint
            health_url = f"http://127.0.0.1:{server_port}/health/health"
            status_code, response = check_http_endpoint(health_url)
            
            if status_code:
                print(f"✅ Health endpoint: {status_code}")
                print(f"📋 Response: {response}")
                
                # Test WebSocket info (if available)
                ws_test_url = f"http://127.0.0.1:{server_port}/ws"
                ws_status, ws_response = check_http_endpoint(ws_test_url)
                if ws_status:
                    print(f"📡 WebSocket endpoint status: {ws_status}")
                else:
                    print(f"❓ WebSocket endpoint test: {ws_response}")
                
                # Test GraphQL endpoint
                graphql_url = f"http://127.0.0.1:{server_port}/graphql"
                gql_status, gql_response = check_http_endpoint(graphql_url)
                if gql_status:
                    print(f"🔗 GraphQL endpoint: {gql_status}")
                else:
                    print(f"❓ GraphQL endpoint: {gql_response}")
                    
                print(f"\n✅ Server appears to be running correctly!")
                print(f"🌐 Frontend should connect to:")
                print(f"   Base URL: http://127.0.0.1:{server_port}")
                print(f"   WebSocket: ws://127.0.0.1:{server_port}/ws")
                print(f"   GraphQL: http://127.0.0.1:{server_port}/graphql")
                
            else:
                print(f"❌ Health endpoint failed: {response}")
        else:
            print(f"❌ Port {server_port} is not accessible")
    else:
        print("❌ No embedded server found")
        print("\n3. Testing default development endpoints...")
        
        # Test common development ports
        test_ports = [8080, 8081, 3000, 3001]
        for port in test_ports:
            if check_port_open('127.0.0.1', port):
                health_url = f"http://127.0.0.1:{port}/health/health"
                status_code, response = check_http_endpoint(health_url)
                if status_code and status_code == 200:
                    print(f"✅ Found Torque server on port {port}")
                    break
        else:
            print("❌ No Torque server found on common ports")
    
    print("\n" + "=" * 50)
    print("📋 Troubleshooting Tips:")
    print("1. Make sure the Torque desktop app is running")
    print("2. Check the app logs for server startup errors")
    print("3. Try restarting the desktop application")
    print("4. Check if any firewall is blocking local connections")

if __name__ == "__main__":
    main()