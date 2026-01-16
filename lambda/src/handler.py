import json
import os
import uuid
from datetime import datetime
import boto3
from botocore.exceptions import ClientError

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE', 'todos-table')
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    """
    Main Lambda handler for CRUD operations on todos
    """
    print(f"Received event: {json.dumps(event)}")
    
    # Extract HTTP method and path
    http_method = event.get('httpMethod', '')
    path = event.get('path', '')
    path_parameters = event.get('pathParameters') or {}
    
    try:
        # Route to appropriate handler
        if path == '/todos' and http_method == 'GET':
            return get_all_todos()
        elif path == '/todos' and http_method == 'POST':
            return create_todo(event)
        elif path.startswith('/todos/') and http_method == 'GET':
            return get_todo(path_parameters.get('id'))
        elif path.startswith('/todos/') and http_method == 'PUT':
            return update_todo(path_parameters.get('id'), event)
        elif path.startswith('/todos/') and http_method == 'DELETE':
            return delete_todo(path_parameters.get('id'))
        else:
            return response(405, {'error': 'Method not allowed'})
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return response(500, {'error': 'Internal server error', 'message': str(e)})

def get_all_todos():
    """
    Get all todos from DynamoDB
    """
    try:
        result = table.scan()
        items = result.get('Items', [])
        
        # Sort by created_at descending
        items.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return response(200, {
            'todos': items,
            'count': len(items)
        })
    
    except ClientError as e:
        print(f"DynamoDB error: {e.response['Error']['Message']}")
        return response(500, {'error': 'Failed to retrieve todos'})

def create_todo(event):
    """
    Create a new todo item
    """
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        title = body.get('title', '').strip()
        description = body.get('description', '').strip()
        
        # Validate input
        if not title:
            return response(400, {'error': 'Title is required'})
        
        # Create todo item
        todo_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        item = {
            'id': todo_id,
            'title': title,
            'description': description,
            'completed': False,
            'created_at': timestamp,
            'updated_at': timestamp
        }
        
        # Save to DynamoDB
        table.put_item(Item=item)
        
        return response(201, {
            'message': 'Todo created successfully',
            'todo': item
        })
    
    except json.JSONDecodeError:
        return response(400, {'error': 'Invalid JSON in request body'})
    except ClientError as e:
        print(f"DynamoDB error: {e.response['Error']['Message']}")
        return response(500, {'error': 'Failed to create todo'})

def get_todo(todo_id):
    """
    Get a specific todo by ID
    """
    if not todo_id:
        return response(400, {'error': 'Todo ID is required'})
    
    try:
        result = table.get_item(Key={'id': todo_id})
        
        if 'Item' not in result:
            return response(404, {'error': 'Todo not found'})
        
        return response(200, {'todo': result['Item']})
    
    except ClientError as e:
        print(f"DynamoDB error: {e.response['Error']['Message']}")
        return response(500, {'error': 'Failed to retrieve todo'})

def update_todo(todo_id, event):
    """
    Update an existing todo item
    """
    if not todo_id:
        return response(400, {'error': 'Todo ID is required'})
    
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Check if todo exists
        result = table.get_item(Key={'id': todo_id})
        if 'Item' not in result:
            return response(404, {'error': 'Todo not found'})
        
        # Build update expression
        update_expression = "SET updated_at = :updated_at"
        expression_values = {
            ':updated_at': datetime.utcnow().isoformat()
        }
        
        if 'title' in body:
            title = body['title'].strip()
            if not title:
                return response(400, {'error': 'Title cannot be empty'})
            update_expression += ", title = :title"
            expression_values[':title'] = title
        
        if 'description' in body:
            update_expression += ", description = :description"
            expression_values[':description'] = body['description'].strip()
        
        if 'completed' in body:
            if not isinstance(body['completed'], bool):
                return response(400, {'error': 'Completed must be a boolean'})
            update_expression += ", completed = :completed"
            expression_values[':completed'] = body['completed']
        
        # Update item in DynamoDB
        result = table.update_item(
            Key={'id': todo_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values,
            ReturnValues='ALL_NEW'
        )
        
        return response(200, {
            'message': 'Todo updated successfully',
            'todo': result['Attributes']
        })
    
    except json.JSONDecodeError:
        return response(400, {'error': 'Invalid JSON in request body'})
    except ClientError as e:
        print(f"DynamoDB error: {e.response['Error']['Message']}")
        return response(500, {'error': 'Failed to update todo'})

def delete_todo(todo_id):
    """
    Delete a todo item
    """
    if not todo_id:
        return response(400, {'error': 'Todo ID is required'})
    
    try:
        # Check if todo exists
        result = table.get_item(Key={'id': todo_id})
        if 'Item' not in result:
            return response(404, {'error': 'Todo not found'})
        
        # Delete from DynamoDB
        table.delete_item(Key={'id': todo_id})
        
        return response(200, {
            'message': 'Todo deleted successfully',
            'id': todo_id
        })
    
    except ClientError as e:
        print(f"DynamoDB error: {e.response['Error']['Message']}")
        return response(500, {'error': 'Failed to delete todo'})

def response(status_code, body):
    """
    Create HTTP response with CORS headers
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps(body)
    }
