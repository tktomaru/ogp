# apache/Dockerfile
FROM httpd:2.4-alpine

# 必要な Proxy モジュールを有効化
# （httpd:2.4-alpine では多くがビルトインですが、念のため明示的にロードする設定ファイルを用意）
COPY httpd.conf /usr/local/apache2/conf/httpd.conf
